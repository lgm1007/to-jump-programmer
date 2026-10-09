/**
 * 순수 로직 테스트 (외부 도구 불필요)
 *   npm test
 */
import assert from 'node:assert/strict';

import { resultsMatch } from '../src/features/runner/core/compare';
import { parseHarnessOutput } from '../src/features/runner/core/protocol';
import { starterCode } from '../src/features/runner/core/languages';
import { computeBestStreak, computeStreak, dayKey } from '../src/lib/date';
import { diffLines, diffStats } from '../src/lib/diff';
import { highlightLines } from '../src/lib/highlight';
import { parseInline, parseMarkdown } from '../src/lib/markdown';

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log('markdown');
test('인라인: 굵게와 코드, 코드 안의 ** 는 굵게가 아님', () => {
  assert.deepEqual(parseInline('**O(n)**이고 `a**b` 다'), [
    { text: 'O(n)', bold: true },
    { text: '이고 ' },
    { text: 'a**b', code: true },
    { text: ' 다' },
  ]);
});
test('블록: 제목 · 목록 · 팁 · 코드 · 표', () => {
  const blocks = parseMarkdown(
    '### 제목\n문단 1\n이어짐\n\n- a\n- b\n\n1. 하나\n2. 둘\n\n> 팁\n\n```python\nx = 1\n```\n\n| A | B |\n|---|---|\n| 1 | `x|y` |',
  );
  assert.deepEqual(
    blocks.map((b) => b.type),
    ['heading', 'paragraph', 'bullet', 'ordered', 'quote', 'code', 'table'],
  );
  const table = blocks[6] as Extract<(typeof blocks)[number], { type: 'table' }>;
  assert.equal(table.rows[0][1][0].text, 'x|y');
  const code = blocks[5] as Extract<(typeof blocks)[number], { type: 'code' }>;
  assert.equal(code.lang, 'python');
  assert.equal(code.code, 'x = 1');
});

console.log('diff');
test('줄 단위 diff', () => {
  const lines = diffLines('a\nb\nc', 'a\nB\nc\nd');
  assert.deepEqual(
    lines.map((l) => l.type),
    ['same', 'del', 'add', 'same', 'add'],
  );
  assert.deepEqual(diffStats(lines), { added: 2, removed: 1 });
});

console.log('compare');
test('exact / unordered / float', () => {
  assert.equal(resultsMatch([1, 2], [1, 2]), true);
  assert.equal(resultsMatch([1, 2], [2, 1]), false);
  assert.equal(resultsMatch([1, 2], [2, 1], 'unordered'), true);
  assert.equal(resultsMatch(0.1 + 0.2, 0.3, 'float'), true);
  assert.equal(resultsMatch(0.1 + 0.2, 0.3), false);
  assert.equal(resultsMatch([[1], [2]], [[1], [2]]), true);
  assert.equal(resultsMatch(true, 1), false);
});

console.log('protocol');
test('케이스별 출력 분리 · 비정상 종료 감지', () => {
  const out = '@@TJ:BEGIN:0\nhello\n\n@@TJ:END:0:OK:1.50:[1,2]\n@@TJ:BEGIN:1\nno newline@@TJ:END:1:ERR:0.10:"boom"\n@@TJ:BEGIN:2\npartial';
  const r = parseHarnessOutput(out);
  assert.equal(r.outputs.length, 2);
  assert.deepEqual(r.outputs[0], { index: 0, ok: true, value: [1, 2], stdout: 'hello\n', timeMs: 1.5 });
  assert.equal(r.outputs[1].ok, false);
  assert.equal(r.outputs[1].stdout, 'no newline');
  assert.equal(r.crashedIndex, 2);
  assert.equal(r.crashedStdout, 'partial');
});

console.log('starter code');
test('언어별 시작 코드', () => {
  const sig = { params: [{ name: 'nums', type: 'int[]' as const }, { name: 'k', type: 'int' as const }], returns: 'string[]' as const };
  assert.match(starterCode('python', sig), /^def solution\(nums, k\):/);
  assert.match(starterCode('java', sig), /public String\[\] solution\(int\[\] nums, int k\)/);
  assert.match(starterCode('cpp', sig), /vector<string> solution\(vector<int> nums, int k\)/);
  assert.match(starterCode('javascript', sig), /^function solution\(nums, k\)/);
});

console.log('highlight');
test('키워드 · 문자열 · 주석 · 여러 줄 토큰', () => {
  const lines = highlightLines('def f():\n    """doc\n    string"""\n    return "x"  # c', 'python');
  assert.equal(lines.length, 4);
  assert.equal(lines[0][0].kind, 'keyword');
  assert.ok(lines[2].some((t) => t.kind === 'string'));
  assert.ok(lines[3].some((t) => t.kind === 'comment'));
});

console.log('date');
test('연속 학습일', () => {
  const today = new Date(2026, 9, 9);
  const k = (d: number) => dayKey(new Date(2026, 9, d));
  assert.equal(computeStreak({ [k(9)]: 1, [k(8)]: 2, [k(7)]: 1, [k(5)]: 1 }, today), 3);
  assert.equal(computeStreak({ [k(8)]: 1, [k(7)]: 1 }, today), 2); // 오늘 아직 안 했으면 어제부터
  assert.equal(computeStreak({ [k(6)]: 1 }, today), 0);
  assert.equal(computeBestStreak({ [k(1)]: 1, [k(2)]: 1, [k(3)]: 1, [k(7)]: 1 }), 3);
});

console.log(`\n✅ ${passed}개 테스트 통과`);
