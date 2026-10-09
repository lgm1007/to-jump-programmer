/**
 * 가벼운 정규식 기반 구문 강조기 (의존성 없음).
 * 학습용 코드 조각(수십~수백 줄)을 대상으로 하며, 정확한 파서가 아니라 "읽기 좋은 색"이 목표다.
 */

export type TokenKind =
  | 'plain'
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'function'
  | 'type'
  | 'annotation';

export interface Token {
  kind: TokenKind;
  text: string;
}

interface LangDef {
  keywords: Set<string>;
  literals?: Set<string>;
  types?: Set<string>;
  lineComments: string[];
  blockComments: [string, string][];
  quotes: string[];
  /** """ / ''' 문자열 (Python, Java 텍스트 블록, Kotlin) */
  triple?: boolean;
  /** 백틱 템플릿 문자열 (JS/TS) */
  template?: boolean;
  /** @Annotation / @decorator */
  annotations?: boolean;
  /** 대문자로 시작하는 식별자를 타입으로 */
  capitalizedTypes?: boolean;
  /** 키워드 대소문자 무시 (SQL) */
  caseInsensitive?: boolean;
  /** `key:` 형태의 키를 타입 색으로 (JSON/YAML) */
  keyColon?: boolean;
  /** Python 문자열 접두어 (f'', r'') */
  stringPrefixes?: boolean;
  /** `$VAR` (bash) */
  dollarVars?: boolean;
}

const words = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

const JAVA_KEYWORDS = words(`abstract assert break case catch class const continue default do else enum extends final
finally for goto if implements import instanceof interface native new package private protected public return
static strictfp super switch synchronized this throw throws transient try volatile while var record yield sealed
permits non-sealed`);
const JAVA_TYPES = words('boolean byte char double float int long short void String Integer Long Object');

const KOTLIN_KEYWORDS = words(`as break class continue do else for fun if in interface is object package return super
this throw try typealias val var when while by catch constructor delegate dynamic field file finally get import init
param property receiver set setparam where actual abstract annotation companion const crossinline data enum expect
external final infix inline inner internal lateinit noinline open operator out override private protected public
reified sealed suspend tailrec vararg`);

const PY_KEYWORDS = words(`and as assert async await break class continue def del elif else except finally for from
global if import in is lambda nonlocal not or pass raise return try while with yield match case`);
const PY_LITERALS = words('True False None');
const PY_TYPES = words('int str float bool list dict set tuple bytes object type range len print enumerate zip map filter sorted reversed min max sum abs any all isinstance super open self cls');

const CPP_KEYWORDS = words(`alignas alignof and asm auto break case catch class const constexpr const_cast continue
decltype default delete do dynamic_cast else enum explicit export extern for friend goto if inline mutable namespace
new noexcept not operator or private protected public register reinterpret_cast return sizeof static static_assert
static_cast struct switch template this thread_local throw try typedef typeid typename union using virtual volatile
while #include #define #pragma #ifndef #ifdef #endif #if #else`);
const CPP_TYPES = words(`bool char double float int long short signed unsigned void size_t string vector map set
unordered_map unordered_set queue priority_queue stack deque pair tuple array list greater less int64_t uint64_t
int32_t std`);

const JS_KEYWORDS = words(`async await break case catch class const continue debugger default delete do else export
extends finally for from function if import in instanceof let new of return static super switch this throw try
typeof var void while with yield get set`);
const TS_KEYWORDS = words(`${[...JS_KEYWORDS].join(' ')} abstract as asserts declare enum implements infer interface
is keyof module namespace never private protected public readonly require satisfies type unique override`);
const JS_LITERALS = words('true false null undefined NaN Infinity');
const TS_TYPES = words('string number boolean any unknown never void object bigint symbol Promise Array Record Partial Pick Omit');

const SQL_KEYWORDS = words(`select from where and or not insert into values update set delete create table index
primary key foreign references alter drop add column join inner left right outer full cross on group by order
having limit offset as distinct union all exists in is null like between case when then else end begin commit
rollback transaction for share lock nowait skip locked asc desc count sum avg min max explain analyze with
recursive returning default constraint unique check view if replace using natural cascade truncate`);

const BASH_KEYWORDS = words(`if then else elif fi for in do done while until case esac function return export local
echo cd ls cat grep sudo docker kubectl git npm npx curl exit set unset source`);

const DEFS: Record<string, LangDef> = {
  java: {
    keywords: JAVA_KEYWORDS,
    literals: words('true false null'),
    types: JAVA_TYPES,
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    quotes: ['"', "'"],
    triple: true,
    annotations: true,
    capitalizedTypes: true,
  },
  kotlin: {
    keywords: KOTLIN_KEYWORDS,
    literals: words('true false null'),
    types: words('Int Long String Boolean Double Float Unit Any List Map Set'),
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    quotes: ['"', "'"],
    triple: true,
    annotations: true,
    capitalizedTypes: true,
  },
  python: {
    keywords: PY_KEYWORDS,
    literals: PY_LITERALS,
    types: PY_TYPES,
    lineComments: ['#'],
    blockComments: [],
    quotes: ['"', "'"],
    triple: true,
    annotations: true,
    capitalizedTypes: true,
    stringPrefixes: true,
  },
  cpp: {
    keywords: CPP_KEYWORDS,
    literals: words('true false nullptr NULL'),
    types: CPP_TYPES,
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    quotes: ['"', "'"],
    capitalizedTypes: true,
  },
  javascript: {
    keywords: JS_KEYWORDS,
    literals: JS_LITERALS,
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    quotes: ['"', "'"],
    template: true,
    annotations: true,
    capitalizedTypes: true,
  },
  typescript: {
    keywords: TS_KEYWORDS,
    literals: JS_LITERALS,
    types: TS_TYPES,
    lineComments: ['//'],
    blockComments: [['/*', '*/']],
    quotes: ['"', "'"],
    template: true,
    annotations: true,
    capitalizedTypes: true,
  },
  sql: {
    keywords: SQL_KEYWORDS,
    literals: words('true false null'),
    types: words('int integer bigint varchar char text timestamp datetime date boolean decimal numeric serial json jsonb'),
    lineComments: ['--'],
    blockComments: [['/*', '*/']],
    quotes: ["'", '"', '`'],
    caseInsensitive: true,
  },
  json: {
    keywords: new Set(),
    literals: words('true false null'),
    lineComments: [],
    blockComments: [],
    quotes: ['"'],
    keyColon: true,
  },
  yaml: {
    keywords: new Set(),
    literals: words('true false null yes no on off'),
    lineComments: ['#'],
    blockComments: [],
    quotes: ['"', "'"],
    keyColon: true,
  },
  bash: {
    keywords: BASH_KEYWORDS,
    lineComments: ['#'],
    blockComments: [],
    quotes: ['"', "'"],
    dollarVars: true,
  },
};

const IDENT = /[A-Za-z_$#][\w$]*/y;
const NUMBER = /(0[xX][\da-fA-F_]+|0[bB][01_]+|\d[\d_]*(\.\d[\d_]*)?([eE][+-]?\d+)?[lLfFdDuUn]*|\.\d+([eE][+-]?\d+)?)/y;
const ANNOTATION = /@[A-Za-z_][\w.]*/y;
const DOLLAR = /\$\{?[A-Za-z_][\w]*\}?/y;

function tokenize(src: string, def: LangDef): Token[] {
  const out: Token[] = [];
  const push = (kind: TokenKind, text: string) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last && last.kind === kind) last.text += text;
    else out.push({ kind, text });
  };
  const nextNonSpace = (from: number) => {
    let k = from;
    while (k < src.length && (src[k] === ' ' || src[k] === '\t')) k++;
    return src[k];
  };

  let i = 0;
  outer: while (i < src.length) {
    for (const [open, close] of def.blockComments) {
      if (src.startsWith(open, i)) {
        const end = src.indexOf(close, i + open.length);
        const j = end < 0 ? src.length : end + close.length;
        push('comment', src.slice(i, j));
        i = j;
        continue outer;
      }
    }
    for (const lc of def.lineComments) {
      if (src.startsWith(lc, i)) {
        const end = src.indexOf('\n', i);
        const j = end < 0 ? src.length : end;
        push('comment', src.slice(i, j));
        i = j;
        continue outer;
      }
    }
    let ch = src[i];
    let prefixLen = 0;
    if (def.stringPrefixes && /[fFrRbBuU]/.test(ch)) {
      const m = /^[fFrRbBuU]{1,2}(?=["'])/.exec(src.slice(i, i + 3));
      if (m && !/[\w$]/.test(src[i - 1] ?? '')) {
        prefixLen = m[0].length;
        ch = src[i + prefixLen];
      }
    }
    if (def.triple && (src.startsWith('"""', i + prefixLen) || src.startsWith("'''", i + prefixLen))) {
      const q = src.slice(i + prefixLen, i + prefixLen + 3);
      const end = src.indexOf(q, i + prefixLen + 3);
      const j = end < 0 ? src.length : end + 3;
      push('string', src.slice(i, j));
      i = j;
      continue;
    }
    if (def.quotes.includes(ch) || (def.template && ch === '`')) {
      const start = i;
      let j = i + prefixLen + 1;
      const multiline = ch === '`';
      while (j < src.length) {
        const c = src[j];
        if (c === '\\') {
          j += 2;
          continue;
        }
        if (c === ch) {
          j++;
          break;
        }
        if (c === '\n' && !multiline) break;
        j++;
      }
      const text = src.slice(start, j);
      push(def.keyColon && nextNonSpace(j) === ':' ? 'type' : 'string', text);
      i = j;
      continue;
    }
    if (def.annotations && ch === '@') {
      ANNOTATION.lastIndex = i;
      const m = ANNOTATION.exec(src);
      if (m) {
        push('annotation', m[0]);
        i += m[0].length;
        continue;
      }
    }
    if (def.dollarVars && ch === '$') {
      DOLLAR.lastIndex = i;
      const m = DOLLAR.exec(src);
      if (m) {
        push('type', m[0]);
        i += m[0].length;
        continue;
      }
    }
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      NUMBER.lastIndex = i;
      const m = NUMBER.exec(src);
      if (m && !/[\w$]/.test(src[i - 1] ?? '')) {
        push('number', m[0]);
        i += m[0].length;
        continue;
      }
    }
    if (/[A-Za-z_$#]/.test(ch)) {
      IDENT.lastIndex = i;
      const m = IDENT.exec(src);
      if (m) {
        const word = m[0];
        const key = def.caseInsensitive ? word.toLowerCase() : word;
        let kind: TokenKind = 'plain';
        if (def.keyColon && nextNonSpace(i + word.length) === ':' && src[i + word.length] !== ':') kind = 'type';
        else if (def.keywords.has(key)) kind = 'keyword';
        else if (def.literals?.has(key)) kind = 'number';
        else if (def.types?.has(word)) kind = 'type';
        else if (nextNonSpace(i + word.length) === '(') kind = 'function';
        else if (def.capitalizedTypes && /^[A-Z][a-z]/.test(word)) kind = 'type';
        push(kind, word);
        i += word.length;
        continue;
      }
    }
    push('plain', ch);
    i++;
  }
  return out;
}

function splitLines(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]];
  for (const t of tokens) {
    const parts = t.text.split('\n');
    parts.forEach((p, idx) => {
      if (idx > 0) lines.push([]);
      if (p) lines[lines.length - 1].push({ kind: t.kind, text: p });
    });
  }
  return lines;
}

const cache = new Map<string, Token[][]>();

/** 코드를 줄 단위 토큰 배열로 변환 */
export function highlightLines(code: string, language: string): Token[][] {
  const key = `${language}\u0000${code}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const def = DEFS[language];
  const result = def ? splitLines(tokenize(code, def)) : code.split('\n').map((l) => (l ? [{ kind: 'plain' as const, text: l }] : []));
  if (cache.size > 300) cache.clear();
  cache.set(key, result);
  return result;
}

export const LANGUAGE_LABEL: Record<string, string> = {
  java: 'Java',
  kotlin: 'Kotlin',
  python: 'Python',
  cpp: 'C++',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  sql: 'SQL',
  json: 'JSON',
  yaml: 'YAML',
  bash: 'Shell',
  text: 'Text',
};
