// 개발용 Piston 호환 실행 서버 — 로컬 JDK(java)와 C++ 컴파일러(g++/clang++)로 Java·C++ 코드를 실행한다.
//
//   node scripts/dev-runner.mjs          # http://127.0.0.1:2000
//   앱 › 마이 › 설정 › 코드 실행 서버에 http://127.0.0.1:2000 입력 (웹/시뮬레이터용)
//
// ⚠️ 샌드박스가 없으므로 로컬 개발·테스트 용도로만 사용하세요. (127.0.0.1 에만 바인딩)
// 운영 환경에서는 infra/runner 의 Piston 서버를 사용하세요.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = Number(process.env.PORT ?? 2000);
const RUN_TIMEOUT_MS = 15_000;
const CXX = spawnSync('g++', ['--version']).status === 0 ? 'g++' : 'clang++';

function exec(cmd, args, cwd, timeoutMs) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd });
    let stdout = '';
    let stderr = '';
    let signal = null;
    const timer = setTimeout(() => {
      signal = 'SIGKILL';
      child.kill('SIGKILL');
    }, timeoutMs);
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: signal ? null : code, signal, output: stdout + stderr });
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: String(e), code: 1, signal: null, output: String(e) });
    });
    child.stdin.end();
  });
}

async function execute(body) {
  const file = body.files?.[0];
  if (!file) return { status: 400, json: { message: 'files is required' } };
  const dir = mkdtempSync(join(tmpdir(), 'tj-dev-runner-'));
  try {
    if (body.language === 'java') {
      // Piston 의 java 패키지처럼 단일 소스 파일 실행 (java Main.java)
      const name = `${file.name ?? 'Main'}.java`;
      writeFileSync(join(dir, name), file.content);
      const run = await exec('java', ['--source', '15', name], dir, RUN_TIMEOUT_MS);
      return { status: 200, json: { language: 'java', version: '15.0.2', run } };
    }
    if (body.language === 'c++' || body.language === 'cpp') {
      const name = `${file.name ?? 'solution'}.cpp`;
      writeFileSync(join(dir, name), file.content);
      const compile = await exec(CXX, ['-std=c++17', '-O2', name, '-o', 'a.out'], dir, 30_000);
      if (compile.code !== 0) {
        return { status: 200, json: { language: 'c++', version: '10.2.0', compile, run: null } };
      }
      const run = await exec(join(dir, 'a.out'), [], dir, RUN_TIMEOUT_MS);
      return { status: 200, json: { language: 'c++', version: '10.2.0', compile, run } };
    }
    return { status: 400, json: { message: `${body.language}-${body.version} runtime is unknown` } };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }
  const send = (status, json) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(json));
  };
  if (req.method === 'GET' && req.url === '/api/v2/runtimes') {
    send(200, [
      { language: 'java', version: '15.0.2', aliases: [] },
      { language: 'c++', version: '10.2.0', aliases: ['cpp', 'g++'] },
    ]);
    return;
  }
  if (req.method === 'POST' && req.url === '/api/v2/execute') {
    let raw = '';
    req.on('data', (d) => {
      raw += d;
      if (raw.length > 1_000_000) req.destroy();
    });
    req.on('end', async () => {
      try {
        const { status, json } = await execute(JSON.parse(raw));
        send(status, json);
      } catch (e) {
        send(500, { message: String(e) });
      }
    });
    return;
  }
  send(404, { message: 'Not Found' });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`To Jump 개발용 실행 서버: http://127.0.0.1:${PORT}  (Java: java, C++: ${CXX})`);
});
