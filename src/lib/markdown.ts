/**
 * markdown-lite 파서 (docs/CONTENT_GUIDE.md 참고)
 * 지원: 문단, **굵게**, `코드`, - 목록, 1. 목록, ### 소제목, > 팁, ```코드 블록```, 표
 */

export interface InlineSpan {
  text: string;
  bold?: boolean;
  code?: boolean;
}

export type Block =
  | { type: 'paragraph'; lines: InlineSpan[][] }
  | { type: 'heading'; spans: InlineSpan[] }
  | { type: 'bullet'; items: InlineSpan[][] }
  | { type: 'ordered'; items: { n: number; spans: InlineSpan[] }[] }
  | { type: 'quote'; lines: InlineSpan[][] }
  | { type: 'code'; lang: string; code: string }
  | { type: 'table'; header: InlineSpan[][]; rows: InlineSpan[][][] };

export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let bold = false;
  let buf = '';
  const flush = () => {
    if (buf) spans.push(bold ? { text: buf, bold: true } : { text: buf });
    buf = '';
  };
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '`') {
      const end = text.indexOf('`', i + 1);
      if (end > i) {
        flush();
        spans.push(bold ? { text: text.slice(i + 1, end), code: true, bold: true } : { text: text.slice(i + 1, end), code: true });
        i = end + 1;
        continue;
      }
    }
    if (ch === '*' && text[i + 1] === '*') {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    if (ch === '\\' && (text[i + 1] === '*' || text[i + 1] === '`')) {
      buf += text[i + 1];
      i += 2;
      continue;
    }
    buf += ch;
    i++;
  }
  flush();
  return spans;
}

const FENCE = /^\s*```\s*([\w+-]*)\s*$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const ORDERED = /^\s*(\d+)[.)]\s+(.*)$/;
const HEADING = /^#{1,6}\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const TABLE_ROW = /^\s*\|.*\|\s*$/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function splitRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  // 인라인 코드 안의 | 는 셀 구분자가 아님
  const cells: string[] = [];
  let cur = '';
  let inCode = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '`') inCode = !inCode;
    if (ch === '\\' && s[i + 1] === '|') {
      cur += '|';
      i++;
      continue;
    }
    if (ch === '|' && !inCode) {
      cells.push(cur.trim());
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

const cache = new Map<string, Block[]>();

export function parseMarkdown(source: string): Block[] {
  const cached = cache.get(source);
  if (cached) return cached;

  const lines = source.replace(/\r\n/g, '\n').replace(/^\n+/, '').replace(/\s+$/, '').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  let paragraph: InlineSpan[][] = [];
  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', lines: paragraph });
    paragraph = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(FENCE);
    if (fence) {
      flushParagraph();
      const code: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // 닫는 펜스
      blocks.push({ type: 'code', lang: fence[1] || 'text', code: code.join('\n') });
      continue;
    }
    if (line.trim() === '') {
      flushParagraph();
      i++;
      continue;
    }
    const heading = line.match(HEADING);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', spans: parseInline(heading[1]) });
      i++;
      continue;
    }
    if (TABLE_ROW.test(line) && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      flushParagraph();
      const header = splitRow(line).map(parseInline);
      i += 2;
      const rows: InlineSpan[][][] = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) {
        rows.push(splitRow(lines[i]).map(parseInline));
        i++;
      }
      blocks.push({ type: 'table', header, rows });
      continue;
    }
    if (QUOTE.test(line)) {
      flushParagraph();
      const quote: InlineSpan[][] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        quote.push(parseInline(lines[i].match(QUOTE)![1]));
        i++;
      }
      blocks.push({ type: 'quote', lines: quote });
      continue;
    }
    if (BULLET.test(line)) {
      flushParagraph();
      const items: InlineSpan[][] = [];
      while (i < lines.length && BULLET.test(lines[i])) {
        items.push(parseInline(lines[i].match(BULLET)![1]));
        i++;
      }
      blocks.push({ type: 'bullet', items });
      continue;
    }
    if (ORDERED.test(line)) {
      flushParagraph();
      const items: { n: number; spans: InlineSpan[] }[] = [];
      while (i < lines.length && ORDERED.test(lines[i])) {
        const m = lines[i].match(ORDERED)!;
        items.push({ n: Number(m[1]), spans: parseInline(m[2]) });
        i++;
      }
      blocks.push({ type: 'ordered', items });
      continue;
    }
    paragraph.push(parseInline(line));
    i++;
  }
  flushParagraph();
  cache.set(source, blocks);
  return blocks;
}

/** 코드 문자열 정리: 앞쪽 빈 줄과 끝 공백 제거 */
export function tidyCode(code: string): string {
  return code.replace(/\r\n/g, '\n').replace(/^\n+/, '').replace(/\s+$/, '');
}

/** 인라인 마크다운을 평문으로 */
export function plainText(text: string): string {
  return parseInline(text)
    .map((s) => s.text)
    .join('');
}
