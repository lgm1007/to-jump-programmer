/**
 * Java · C++ 채점 하네스 테스트 — 모든 ValueType 의 값 왕복(리터럴 생성 → 실행 → JSON 직렬화)과
 * 에러 줄 번호 변환을 실제 컴파일러로 확인한다. (JDK 15+ 와 g++/clang++ 필요)
 *   npm run test:harness
 */
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { Signature, ValueType } from '../src/content/types';
import { resultsMatch } from '../src/features/runner/core/compare';
import { buildCppProgram, mapCppErrors } from '../src/features/runner/core/cpp-harness';
import { buildJavaProgram, mapJavaErrors } from '../src/features/runner/core/java-harness';
import { CPP_TYPE, JAVA_TYPE } from '../src/features/runner/core/languages';
import { parseHarnessOutput } from '../src/features/runner/core/protocol';

const CXX = spawnSync('g++', ['--version']).status === 0 ? 'g++' : 'clang++';

const SAMPLES: Record<ValueType, unknown[]> = {
  int: [0, -2147483648, 2147483647, -5],
  long: [9007199254740991, -9007199254740991, 0],
  double: [0.1, -1.5, 3, 1e-7, 1e21],
  bool: [true, false],
  string: ['', '안녕 "세상" \\ 끝', 'a\nb\tc', '??=', '😀 emoji'],
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

function checkRoundTrip(lang: 'java' | 'cpp', t: ValueType, values: unknown[], stdout: string) {
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

console.log(`\n✅ 하네스 테스트 통과 (${passed}개 타입 × 2개 언어 + 에러 매핑)`);
