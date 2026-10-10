/**
 * dist/ 를 GitHub Pages 와 같은 방식으로 띄운다 (웹 빌드 확인용).
 *   npm run preview:web                                  # http://127.0.0.1:4173/
 *   TJ_WEB_BASE_URL=/to-jump-programmer npm run preview:web   # http://127.0.0.1:4173/to-jump-programmer/
 * - 배포 경로(TJ_WEB_BASE_URL) 아래에서 dist/ 파일을 내려 준다
 * - 폴더 주소는 / 를 붙인 주소로 리디렉션하고, 없는 경로는 404 상태 코드와 함께 404.html 을 내려 준다 (GitHub Pages 와 같음)
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const BASE = (process.env.TJ_WEB_BASE_URL ?? '').trim().replace(/\/+$/, '');
const PORT = Number(process.env.PORT ?? 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('✗ dist/ 가 없습니다. 먼저 npm run build:web 을 실행하세요.');
  process.exit(1);
}

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  if (BASE && path === BASE) {
    res.writeHead(301, { Location: `${BASE}/` }).end();
    return;
  }
  const send = (status, file) => {
    res.writeHead(status, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(readFileSync(file));
  };
  if (path.startsWith(`${BASE}/`)) {
    const rel = normalize(path.slice(BASE.length)).replace(/^(\.\.[/\\])+/, '');
    let file = join(DIST, rel);
    if (existsSync(file) && statSync(file).isDirectory()) {
      // GitHub Pages 처럼 폴더 주소는 / 로 끝나는 주소로 보낸다
      if (!path.endsWith('/')) {
        res.writeHead(301, { Location: `${path}/` }).end();
        return;
      }
      file = join(file, 'index.html');
    }
    if (existsSync(file) && statSync(file).isFile()) return send(200, file);
  }
  send(404, join(DIST, '404.html'));
}).listen(PORT, '127.0.0.1', () => {
  console.log(`웹 빌드 미리보기: http://127.0.0.1:${PORT}${BASE}/`);
});
