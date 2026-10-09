/**
 * Java · Kotlin · C++ 채점 하네스 테스트 — 모든 ValueType 의 값 왕복(리터럴 생성 → 실행 → JSON 직렬화)과
 * 에러 줄 번호 변환을 실제 컴파일러로 확인한다. (JDK 15+, g++/clang++, kotlinc 필요)
 *   npm run test:harness
 * Kotlin 은 KOTLINC(컴파일러 경로)와 KOTLIN_JAVA_HOME(컴파일·실행에 쓸 JDK)로 Piston 과 같은 조합을 지정할 수 있다.
 *   KOTLINC=~/kotlinc-1.8.20/bin/kotlinc KOTLIN_JAVA_HOME=<JDK 8 경로> npm run test:harness
 */
import assert from 'node:assert/strict';
import { execFile, execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

import type { Signature, ValueType } from '../src/content/types';
import { resultsMatch } from '../src/features/runner/core/compare';
import { buildCppProgram, mapCppErrors } from '../src/features/runner/core/cpp-harness';
import { buildJavaProgram, mapJavaErrors } from '../src/features/runner/core/java-harness';
import { buildKotlinProgram, mapKotlinErrors } from '../src/features/runner/core/kotlin-harness';
import { CPP_TYPE, JAVA_TYPE, KOTLIN_TYPE, starterCode } from '../src/features/runner/core/languages';
import { parseHarnessOutput } from '../src/features/runner/core/protocol';

const CXX = spawnSync('g++', ['--version']).status === 0 ? 'g++' : 'clang++';
const KOTLINC = process.env.KOTLINC ?? 'kotlinc';
const KOTLIN_JAVA_HOME = process.env.KOTLIN_JAVA_HOME;
const KOTLIN_ENV = KOTLIN_JAVA_HOME ? { ...process.env, JAVA_HOME: KOTLIN_JAVA_HOME } : process.env;
const KOTLIN_JAVA = KOTLIN_JAVA_HOME ? join(KOTLIN_JAVA_HOME, 'bin', 'java') : 'java';
const HAS_KOTLIN = spawnSync(KOTLINC, ['-version'], { env: KOTLIN_ENV }).status === 0;
const execFileAsync = promisify(execFile);

const SAMPLES: Record<ValueType, unknown[]> = {
  int: [0, -2147483648, 2147483647, -5],
  long: [9007199254740991, -9007199254740991, 0],
  double: [0.1, -1.5, 3, 1e-7, 1e21],
  bool: [true, false],
  string: ['', '안녕 "세상" \\ 끝', 'a\nb\tc', '??=', '😀 emoji', 'cost $5 ${x}'],
  'int[]': [[], [1, -2, 3], [-2147483648]],
  'long[]': [[], [9007199254740991]],
  'double[]': [[], [0.5, -2.25]],
  'bool[]': [[], [true, false, true]],
  'string[]': [[], ['a', '', '한글', 'q"uote']],
  'int[][]': [[], [[]], [[1, 2], [], [3]]],
  'string[][]': [[], [['a', 'b'], []], [['한', '글']]],
};

function runJava(source: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'tj-test-java-'));
  try {
    writeFileSync(join(dir, 'Main.java'), source);
    execFileSync('javac', ['--release', '15', '-encoding', 'UTF-8', '-d', 'out', 'Main.java'], { cwd: dir, stdio: 'pipe' });
    return execFileSync('java', ['-cp', 'out', 'Main'], { cwd: dir }).toString();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function runCpp(source: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'tj-test-cpp-'));
  try {
    writeFileSync(join(dir, 'solution.cpp'), source);
    execFileSync(CXX, ['-std=c++17', '-o', 'sol', 'solution.cpp'], { cwd: dir, stdio: 'pipe' });
    return execFileSync(join(dir, 'sol'), [], { cwd: dir }).toString();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Kotlin 은 컴파일이 느려 비동기로 병렬 실행한다 */
async function runKotlin(source: string): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const dir = mkdtempSync(join(tmpdir(), 'tj-test-kotlin-'));
  try {
    writeFileSync(join(dir, 'Main.kt'), source);
    try {
      await execFileAsync(KOTLINC, ['Main.kt', '-include-runtime', '-d', 'code.jar'], { cwd: dir, env: KOTLIN_ENV });
    } catch (e) {
      return { ok: false, stdout: '', stderr: String((e as { stderr?: string }).stderr ?? e) };
    }
    const r = await execFileAsync(KOTLIN_JAVA, ['-jar', 'code.jar'], { cwd: dir });
    return { ok: true, stdout: r.stdout, stderr: r.stderr };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function pool<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

function checkRoundTrip(lang: 'java' | 'cpp' | 'kotlin', t: ValueType, values: unknown[], stdout: string) {
  const parsed = parseHarnessOutput(stdout);
  assert.equal(parsed.outputs.length, values.length, `${lang} ${t}: 케이스 수`);
  parsed.outputs.forEach((o, i) => {
    assert.ok(o.ok, `${lang} ${t}[${i}] 실행 실패: ${String(o.value)}`);
    assert.ok(resultsMatch(values[i], o.value, t.startsWith('double') ? 'float' : 'exact'), `${lang} ${t}[${i}] 값 불일치: ${JSON.stringify(o.value)}`);
    assert.equal(o.stdout, `log-${t}`, `${lang} ${t}[${i}] 출력 분리`);
  });
}

let passed = 0;
for (const [t, values] of Object.entries(SAMPLES) as [ValueType, unknown[]][]) {
  const sig: Signature = { params: [{ name: 'x', type: t }], returns: t };
  const tests = values.map((v) => ({ input: [v], output: v }));

  const jt = JAVA_TYPE[t];
  const javaUser = `import java.util.*;\n\nclass Solution {\n    public ${jt} solution(${jt} x) {\n        System.out.print("log-" + "${t}");\n        return x;\n    }\n}\n`;
  checkRoundTrip('java', t, values, runJava(buildJavaProgram(javaUser, sig, tests).source));

  const ct = CPP_TYPE[t];
  const cppUser = `#include <string>\n#include <vector>\n\nusing namespace std;\n\n${ct} solution(${ct} x) {\n    printf("log-%s", "${t}");\n    return x;\n}\n`;
  checkRoundTrip('cpp', t, values, runCpp(buildCppProgram(cppUser, sig, tests).source));
  passed++;
  console.log(`  ✓ ${t}`);
}

// 런타임 에러 줄 번호
{
  const sig: Signature = { params: [{ name: 'n', type: 'int' }], returns: 'int' };
  const user = `class Solution {\n    public int solution(int n) {\n        int[] a = new int[2];\n        return a[n];\n    }\n}\n`;
  const r = parseHarnessOutput(runJava(buildJavaProgram(user, sig, [{ input: [5], output: 0 }, { input: [1], output: 0 }]).source));
  assert.equal(r.outputs[0].ok, false);
  assert.match(String(r.outputs[0].value), /ArrayIndexOutOfBounds[\s\S]*4번째 줄/);
  assert.equal(r.outputs[1].ok, true, '에러 다음 케이스도 계속 실행');
  console.log('  ✓ Java 런타임 에러 줄 번호');
}

// 주석이 붙은 import 줄도 파일 맨 위로 옮겨진다
{
  const sig: Signature = { params: [{ name: 'n', type: 'int' }], returns: 'int[]' };
  const user = `import java.util.*; // 컬렉션\nimport java.util.stream.Collectors; /* 스트림 */\n\nclass Solution {\n    public int[] solution(int n) {\n        List<Integer> a = new ArrayList<>();\n        for (int i = 0; i < n; i++) a.add(i);\n        return a.stream().mapToInt(Integer::intValue).toArray();\n    }\n}\n`;
  const r = parseHarnessOutput(runJava(buildJavaProgram(user, sig, [{ input: [3], output: [0, 1, 2] }]).source));
  assert.equal(r.outputs[0].ok, true);
  assert.deepEqual(r.outputs[0].value, [0, 1, 2]);
  console.log('  ✓ Java import 줄 주석 처리');
}

// 컴파일 에러 줄 번호
{
  const sig: Signature = { params: [{ name: 'n', type: 'int' }], returns: 'int' };
  const bad = `class Solution {\n    public int solution(int n) {\n        return n +;\n    }\n}\n`;
  const prog = buildJavaProgram(bad, sig, [{ input: [1], output: 1 }]);
  const dir = mkdtempSync(join(tmpdir(), 'tj-test-java-'));
  writeFileSync(join(dir, 'Main.java'), prog.source);
  const res = spawnSync('javac', ['-d', 'out', 'Main.java'], { cwd: dir });
  rmSync(dir, { recursive: true, force: true });
  assert.match(mapJavaErrors(res.stderr.toString(), prog.offset), /3번째 줄: error/);

  const badCpp = `int solution(int n) {\n    return n +;\n}\n`;
  const cprog = buildCppProgram(badCpp, sig, [{ input: [1], output: 1 }]);
  const cdir = mkdtempSync(join(tmpdir(), 'tj-test-cpp-'));
  writeFileSync(join(cdir, 'solution.cpp'), cprog.source);
  const cres = spawnSync(CXX, ['-std=c++17', '-o', 'sol', 'solution.cpp'], { cwd: cdir });
  rmSync(cdir, { recursive: true, force: true });
  assert.match(mapCppErrors(cres.stderr.toString(), cprog.offset, badCpp.split('\n').length), /2번째 줄:\d+: error/);
  console.log('  ✓ 컴파일 에러 줄 번호 (Java, C++)');
}

// ---- Kotlin ----
async function testKotlin() {
  if (!HAS_KOTLIN) {
    console.log(`\n⚠️  ${KOTLINC} 를 찾을 수 없어 Kotlin 하네스 테스트를 건너뜁니다. (brew install kotlin 또는 KOTLINC 지정)`);
    return false;
  }
  const version = spawnSync(KOTLINC, ['-version'], { env: KOTLIN_ENV }).stderr.toString().trim();
  console.log(`\n  ${version}`);
  const types = Object.entries(SAMPLES) as [ValueType, unknown[]][];
  const results = await pool(types, 6, async ([t, values]) => {
    const sig: Signature = { params: [{ name: 'x', type: t }], returns: t };
    const kt = KOTLIN_TYPE[t];
    const user = `import java.util.*\n\nclass Solution {\n    fun solution(x: ${kt}): ${kt} {\n        print("log-" + "${t}")\n        return x\n    }\n}\n`;
    const tests = values.map((v) => ({ input: [v], output: v }));
    return { t, values, run: await runKotlin(buildKotlinProgram(user, sig, tests).source) };
  });
  for (const { t, values, run } of results) {
    assert.ok(run.ok, `kotlin ${t} 컴파일 실패:\n${run.stderr}`);
    checkRoundTrip('kotlin', t, values, run.stdout);
    console.log(`  ✓ kotlin ${t}`);
  }

  // 시작 코드(starter)가 모든 반환 타입에서 컴파일되는지 — 클래스 이름만 바꿔 한 파일로 컴파일한다
  const starters = types
    .map(([t], i) => starterCode('kotlin', { params: [{ name: 'x', type: t }], returns: t }).replace('class Solution', `class Starter${i}`))
    .join('\n');
  const starterRun = await runKotlin(`${starters}\nfun main() {}\n`);
  assert.ok(starterRun.ok, `Kotlin 시작 코드 컴파일 실패:\n${starterRun.stderr}`);
  console.log('  ✓ Kotlin 시작 코드 컴파일 (12개 반환 타입)');

  const intSig: Signature = { params: [{ name: 'n', type: 'int' }], returns: 'int' };
  const compiled = (code: string) => {
    const prog = buildKotlinProgram(code, intSig, [{ input: [1], output: 1 }]);
    return runKotlin(prog.source).then((run) => ({ prog, run }));
  };
  const [runtime, imports, compile, harnessSide] = await Promise.all([
    // 런타임 에러 줄 번호 + 다음 케이스 계속 실행
    runKotlin(
      buildKotlinProgram(`class Solution {\n    fun solution(n: Int): Int {\n        val a = IntArray(2)\n        return a[n]\n    }\n}\n`, intSig, [
        { input: [5], output: 0 },
        { input: [1], output: 0 },
      ]).source,
    ),
    // package 줄과 주석·별칭이 붙은 import 줄도 처리한다
    runKotlin(
      buildKotlinProgram(
        `package com.example\n\nimport java.util.PriorityQueue // 우선순위 큐\nimport kotlin.math.max as biggest /* 별칭 */\n\nclass Solution {\n    fun solution(n: Int): Int {\n        val pq = PriorityQueue<Int>(listOf(3, 1, 2))\n        return biggest(pq.poll(), n)\n    }\n}\n`,
        intSig,
        [{ input: [0], output: 1 }],
      ).source,
    ),
    // 사용자 코드의 컴파일 에러 (경고와 함께)
    compiled(`class Solution {\n    fun solution(n: Int): Int {\n        val unused = 1\n        return n + missing\n    }\n}\n`),
    // 시그니처가 문제와 달라 하네스 쪽에서 난 컴파일 에러
    compiled(`class Solution {\n    fun solution(n: Long): Long {\n        return n\n    }\n}\n`),
  ]);

  assert.ok(runtime.ok, runtime.stderr);
  const r = parseHarnessOutput(runtime.stdout);
  assert.equal(r.outputs[0].ok, false);
  assert.match(String(r.outputs[0].value), /ArrayIndexOutOfBounds[\s\S]*Solution\.solution \(4번째 줄\)/);
  assert.equal(r.outputs[1].ok, true, '에러 다음 케이스도 계속 실행');
  console.log('  ✓ Kotlin 런타임 에러 줄 번호');

  assert.ok(imports.ok, imports.stderr);
  assert.deepEqual(parseHarnessOutput(imports.stdout).outputs[0]?.value, 1);
  console.log('  ✓ Kotlin package · import(주석 · 별칭) 처리');

  assert.equal(compile.run.ok, false);
  const mapped = mapKotlinErrors(compile.run.stderr, compile.prog.offset);
  assert.match(mapped, /^4번째 줄:\d+: error/m);
  assert.doesNotMatch(mapped, /warning|Main\.kt/);
  console.log('  ✓ Kotlin 컴파일 에러 줄 번호');

  assert.equal(harnessSide.run.ok, false);
  assert.match(mapKotlinErrors(harnessSide.run.stderr, harnessSide.prog.offset), /채점 코드:[\s\S]*파라미터/);
  console.log('  ✓ Kotlin 시그니처 불일치 안내');
  return true;
}

testKotlin()
  .then((kotlin) => {
    console.log(`\n✅ 하네스 테스트 통과 (${passed}개 타입 × ${kotlin ? 3 : 2}개 언어 + 에러 매핑)`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
