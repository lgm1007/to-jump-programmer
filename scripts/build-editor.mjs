// CodeMirror 에디터를 단일 HTML 문자열로 번들링한다.
//   npm run build:editor
import { build } from 'esbuild';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const result = await build({
  entryPoints: [join(root, 'editor', 'src', 'main.ts')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020', 'safari15', 'chrome90'],
  write: false,
  legalComments: 'none',
});
const js = result.outputFiles[0].text;

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<style>
html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; -webkit-text-size-adjust: 100%; }
body { -webkit-tap-highlight-color: transparent; }
#editor { position: absolute; inset: 0; }
.cm-editor { height: 100%; }
</style>
</head>
<body>
<div id="editor"></div>
<script>${js.replace(/<\/script/gi, '<\\/script')}</script>
</body>
</html>`;

const out = join(root, 'src', 'features', 'editor', 'editor-html.generated.ts');
writeFileSync(
  out,
  `// 자동 생성 파일입니다. editor/src/main.ts 를 수정한 뒤 \`npm run build:editor\` 를 실행하세요.\n` +
    `export const EDITOR_HTML = ${JSON.stringify(html)};\n`,
);
console.log(`editor-html.generated.ts 생성 (${(html.length / 1024).toFixed(0)}KB)`);
