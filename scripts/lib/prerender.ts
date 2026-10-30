/**
 * 웹 빌드의 정적 페이지 — 콘텐츠 화면마다 실제 본문을 HTML 로 미리 만든다 (scripts/web-routes.ts 가 쓴다).
 *
 * 웹 앱은 JS 로 화면을 그리는 SPA 라, 그대로 두면 모든 주소의 HTML 이 내용 없는 같은 껍데기다. 그러면 JS 를
 * 실행하지 않는 크롤러(검색 · AdSense 심사)에게는 콘텐츠가 없는 페이지로 보인다. 그래서 주소마다 그 화면과 같은
 * 콘텐츠(레슨 본문, 개념 정리, 유형 예제, 리뷰 패턴 …)를 담은 HTML 을 #root 안에 넣고, 제목 · 설명도 페이지별로 둔다.
 * 앱 JS 가 실행되면 React 가 #root 를 비우고 앱 화면을 그리므로 사용자에게는 불러오는 동안의 첫 화면이 된다.
 * 크롤러에게만 다른 내용을 보여주지 않도록, 앱 화면에 있는 콘텐츠만 담는다.
 */
import {
  ALGO_PATTERN_MAP,
  ALGO_PATTERNS,
  ALGO_QUIZ,
  ALGO_TOPIC_MAP,
  ALGO_TOPICS,
  ALL_LESSONS,
  CHALLENGE_MAP,
  CONTENT_STATS,
  CS_CATEGORIES,
  CS_CATEGORY_MAP,
  CS_CONTENT,
  CS_GROUPS,
  isCaseCategory,
  PATTERN_MAP,
  REVIEW_CATEGORY_LABEL,
  REVIEW_CONTENT,
  REVIEW_FRAMEWORK_MAP,
  REVIEW_FRAMEWORKS,
  type AlgoPattern,
  type CsLesson,
  type Difficulty,
  type ReviewChallenge,
  type ReviewPattern,
} from '../../src/content';
import { aboutText } from '../../src/content/about';
import { GITHUB_URL, PRIVACY_POLICY } from '../../src/content/legal';
import { formatValue } from '../../src/lib/format';
import { parseInline, parseMarkdown, plainText, tidyCode, type InlineSpan } from '../../src/lib/markdown';

export interface StaticPage {
  /** 사이트 기준 경로 ('' = 홈, 'interview/lesson/cs-os-l01') */
  path: string;
  /** 페이지 제목 (사이트 이름은 붙이지 않음) */
  title: string;
  description: string;
  /** #root 에 넣을 본문 HTML (빈 문자열이면 앱 셸 그대로) */
  html: string;
  /** 검색 결과에 넣지 않는 앱 기능 화면 (온보딩 · 퀴즈 풀이 · 설정 …) */
  noindex?: boolean;
}

export const SITE_NAME = 'To Jump Programmer';
export const SITE_DESCRIPTION = '코딩 테스트 · 코드 리뷰 · 기술 면접을 하루 10분씩 준비하는 개발자 취업·이직 학습 앱';

const DIFFICULTY: Record<Difficulty, string> = { 1: '기초', 2: '중급', 3: '심화' };

/* ------------------------------------------------------------------ */
/* HTML 조각                                                            */
/* ------------------------------------------------------------------ */

export function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function spans(list: InlineSpan[]): string {
  return list
    .map((s) => (s.code ? `<code>${esc(s.text)}</code>` : s.bold ? `<strong>${esc(s.text)}</strong>` : esc(s.text)))
    .join('');
}

/** 인라인 RichText(**굵게**, `코드`) */
function inline(text: string): string {
  return spans(parseInline(text));
}

/** RichText 본문 — '###' 소제목은 heading 단계로 */
function rich(text: string, heading: 2 | 3 = 2): string {
  return parseMarkdown(text)
    .map((b) => {
      switch (b.type) {
        case 'paragraph':
          return `<p>${b.lines.map(spans).join('<br>')}</p>`;
        case 'heading':
          return `<h${heading}>${spans(b.spans)}</h${heading}>`;
        case 'bullet':
          return `<ul>${b.items.map((i) => `<li>${spans(i)}</li>`).join('')}</ul>`;
        case 'ordered':
          return `<ol>${b.items.map((i) => `<li value="${i.n}">${spans(i.spans)}</li>`).join('')}</ol>`;
        case 'quote':
          return `<blockquote>${b.lines.map((l) => `<p>${spans(l)}</p>`).join('')}</blockquote>`;
        case 'code':
          return codeBlock(b.code, b.lang);
        case 'table':
          return `<table><thead><tr>${b.header.map((h) => `<th>${spans(h)}</th>`).join('')}</tr></thead><tbody>${b.rows
            .map((r) => `<tr>${b.header.map((_, k) => `<td>${spans(r[k] ?? [])}</td>`).join('')}</tr>`)
            .join('')}</tbody></table>`;
        default:
          return '';
      }
    })
    .join('\n');
}

function codeBlock(code: string, lang?: string, filename?: string): string {
  const cls = lang ? ` class="language-${esc(lang)}"` : '';
  const name = filename ? `<div class="file">${esc(filename)}</div>` : '';
  return `${name}<pre><code${cls}>${esc(tidyCode(code))}</code></pre>`;
}

function describe(text: string, max = 150): string {
  const plain = parseMarkdown(text)
    .flatMap((b) => (b.type === 'paragraph' ? b.lines.map((l) => l.map((s) => s.text).join('')) : []))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
}

function list(items: string[]): string {
  return items.length ? `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : '';
}

/* ------------------------------------------------------------------ */
/* 페이지                                                                */
/* ------------------------------------------------------------------ */

/** 사이트 안 링크 주소 (prefix 는 '/' 또는 '/하위경로/') */
type Href = (path: string) => string;

function layout(href: Href, crumbs: [string, string][], body: string): string {
  const nav = [
    ['algorithm', '알고리즘'],
    ['review', '코드 리뷰'],
    ['interview', '면접 CS'],
    ['about', '서비스 소개'],
  ]
    .map(([p, t]) => `<a href="${href(p)}">${t}</a>`)
    .join('');
  const trail = crumbs.length
    ? `<p class="crumbs">${[['', '홈'] as [string, string], ...crumbs].map(([p, t]) => `<a href="${href(p)}">${esc(t)}</a>`).join(' › ')}</p>`
    : '';
  return [
    '<div class="tj-pre">',
    `<header><div class="bar"><a class="brand" href="${href('')}">${SITE_NAME}</a><nav>${nav}</nav></div></header>`,
    `<main>${trail}${body}</main>`,
    `<footer><a href="${href('about')}">서비스 소개</a> · <a href="${href('privacy')}">개인정보 처리방침</a> · <a href="${GITHUB_URL}" rel="noopener">GitHub</a><br>© ${SITE_NAME} — 학습 기록은 사용자의 브라우저에만 저장됩니다.</footer>`,
    '</div>',
  ].join('');
}

function homePage(href: Href): StaticPage {
  const s = CONTENT_STATS;
  const topics = ALGO_TOPICS.map(
    (t) => `<a href="${href(`algorithm/topic/${t.id}`)}">${esc(t.title)}</a> — ${esc(t.description)}`,
  );
  const frameworks = REVIEW_FRAMEWORKS.map(
    (f) => `<strong>${esc(f.title)}</strong> (${esc(f.subtitle)}) — 개선 패턴 ${REVIEW_CONTENT[f.id].patterns.length}개 · 리뷰 퀴즈 ${REVIEW_CONTENT[f.id].challenges.length}개`,
  );
  const groups = CS_GROUPS.map((g) => {
    const cats = CS_CATEGORIES.filter((c) => c.group === g.id);
    return `<h3>${esc(g.title)}</h3>${list(cats.map((c) => `<a href="${href(`interview/${c.id}`)}">${esc(c.title)}</a> — ${esc(c.description)}`))}`;
  }).join('');
  const body = `
<h1>개발자 취업 · 이직, 하루 10분씩 준비해요</h1>
<p class="lead">${esc(SITE_NAME)}는 코딩 테스트, 코드 리뷰, 기술 면접을 한곳에서 준비하는 무료 학습 서비스입니다. 이론을 먼저 읽고, 확인 퀴즈로 점검하고, 틀린 문제는 해설과 관련 이론으로 돌아가 복습합니다. 회원가입 없이 바로 쓸 수 있고, 학습 기록은 브라우저에만 저장됩니다.</p>
<h2><a href="${href('algorithm')}">알고리즘 · 코딩 테스트</a></h2>
<p>${ALGO_TOPICS.length}개 토픽의 개념 정리와 개념 퀴즈 ${s.algoQuestions}문항, 자주 나오는 문제 유형 ${s.algoPatterns}개를 Python · Java · Kotlin · C++ · JavaScript 구현 예제로 비교합니다.</p>
${list(topics)}
<h2><a href="${href('review')}">코드 리뷰 테스트</a></h2>
<p>실무에서 자주 지적되는 개선 패턴 ${s.patterns}개를 개선 전 · 후 코드로 익히고, 리뷰 실전 퀴즈 ${s.challenges}개에서 문제 있는 코드 줄을 직접 찾아봅니다.</p>
${list(frameworks)}
<h2><a href="${href('interview')}">기술 면접 CS</a></h2>
<p>${CS_CATEGORIES.length}개 카테고리의 이론 레슨 ${s.lessons}개, 퀴즈 ${s.csQuestions}문항, 모범 답변과 꼬리 질문 · 답변이 있는 면접 질문 카드 ${s.cards}장을 제공합니다.</p>
${groups}
<h2>이렇게 공부해요</h2>
${list([
  '<strong>오늘의 학습</strong> — 하루 목표에 맞춰 퀴즈 · 알고리즘 유형 · CS 이론 · 코드 리뷰 · 면접 질문을 추천합니다.',
  '<strong>코스 맞춤</strong> — 백엔드 · 프론트엔드 · 풀스택 코스와 고른 언어 · 프레임워크에 맞는 문제만 냅니다.',
  '<strong>오답노트 · 북마크</strong> — 틀린 문제와 저장한 문제를 다시 풀고, 관련 이론으로 돌아갑니다.',
  '<strong>연속 학습일 · 학습 잔디</strong> — 매일 조금씩 이어 가는 학습 기록을 보여 줍니다.',
])}`;
  return { path: '', title: '코딩 테스트 · 코드 리뷰 · 기술 면접 준비', description: SITE_DESCRIPTION, html: layout(href, [], body) };
}

function algorithmPage(href: Href): StaticPage {
  const body = `
<h1>알고리즘 · 코딩 테스트</h1>
<p class="lead">이론을 익히고, 자주 나오는 유형을 5개 언어 구현 예제로 비교해요. 토픽마다 개념 정리와 개념 퀴즈, 유형별 예제가 있습니다.</p>
${ALGO_TOPICS.map((t) => {
  const patterns = ALGO_PATTERNS[t.id] ?? [];
  return `<h2><a href="${href(`algorithm/topic/${t.id}`)}">${esc(t.title)}</a></h2><p>${esc(t.description)}</p>${list(
    patterns.map((p) => `<a href="${href(`algorithm/pattern/${p.id}`)}">${esc(p.title)}</a> — ${inline(p.summary)}`),
  )}`;
}).join('\n')}`;
  return {
    path: 'algorithm',
    title: '알고리즘 · 코딩 테스트 — 토픽별 개념과 유형 예제',
    description: `알고리즘 ${ALGO_TOPICS.length}개 토픽의 개념 정리와 자주 나오는 문제 유형 ${CONTENT_STATS.algoPatterns}개를 Python · Java · Kotlin · C++ · JavaScript 구현 예제로 비교합니다.`,
    html: layout(href, [['algorithm', '알고리즘']], body),
  };
}

function topicPage(href: Href, topicId: string): StaticPage {
  const t = ALGO_TOPIC_MAP[topicId];
  const patterns = ALGO_PATTERNS[topicId] ?? [];
  const primer = ALGO_QUIZ[topicId]?.primer ?? '';
  const quizCount = ALGO_QUIZ[topicId]?.questions.length ?? 0;
  const body = `
<h1>${esc(t.title)}</h1>
<p class="lead">${esc(t.description)}</p>
<h2>개념 정리</h2>
${rich(primer, 3)}
${patterns.length ? `<h2>자주 나오는 유형 ${patterns.length}가지</h2>${list(patterns.map((p) => `<a href="${href(`algorithm/pattern/${p.id}`)}">${esc(p.title)}</a> (${DIFFICULTY[p.difficulty]}) — ${inline(p.summary)}`))}` : ''}
${quizCount ? `<p>앱에서 이 토픽의 개념 퀴즈 ${quizCount}문제로 이해한 내용을 확인할 수 있습니다.</p>` : ''}`;
  return {
    path: `algorithm/topic/${topicId}`,
    title: `${t.title} — 알고리즘 개념 정리`,
    description: `${t.description}. ${describe(primer, 110)}`,
    html: layout(href, [['algorithm', '알고리즘'], [`algorithm/topic/${topicId}`, t.title]], body),
  };
}

function patternPage(href: Href, p: AlgoPattern): StaticPage {
  const t = ALGO_TOPIC_MAP[p.topicId];
  const params = p.example.signature.params;
  const examples = p.example.examples.map(
    (ex) => `<code>${esc(params.map((pr, j) => `${pr.name} = ${formatValue(ex.input[j], 300)}`).join(', '))}</code> → <code>${esc(formatValue(ex.output, 300))}</code>`,
  );
  const impls = p.implementations
    .map(
      (im) => `<h3>${esc(im.title)}</h3><p>${inline(im.summary)}</p><p>시간 복잡도 <code>${esc(im.complexity.time)}</code> · 공간 복잡도 <code>${esc(im.complexity.space)}</code></p>
${codeBlock(im.code.python, 'python', 'Python')}
${list(im.keyPoints.map((k) => `<strong>${esc(k.title)}</strong>${rich(k.explanation, 3)}`))}`,
    )
    .join('\n');
  const body = `
<h1>${esc(p.title)}</h1>
<p class="lead">${inline(p.summary)} <span class="tag">${esc(t.title)} · ${DIFFICULTY[p.difficulty]}</span></p>
<h2>이런 문제에서 써요</h2>
${list(p.whenToUse.map(inline))}
<h2>접근 방법</h2>
${rich(p.approach, 3)}
<h2>예제 문제</h2>
${rich(p.example.description, 3)}
${list(examples)}
<h2>구현 예제</h2>
<p>앱에서는 같은 풀이를 Python · Java · Kotlin · C++ · JavaScript 로 바꿔 가며 비교할 수 있습니다. 모든 예제는 다섯 언어로 실행해 테스트를 통과한 코드입니다.</p>
${impls}
${p.pitfalls?.length ? `<h2>자주 하는 실수</h2>${list(p.pitfalls.map(inline))}` : ''}`;
  return {
    path: `algorithm/pattern/${p.id}`,
    title: `${p.title} — ${t.title} 유형 · 5개 언어 구현 예제`,
    description: `${plainText(p.summary)} ${describe(p.approach, 100)}`.slice(0, 160),
    html: layout(href, [['algorithm', '알고리즘'], [`algorithm/topic/${p.topicId}`, t.title], [`algorithm/pattern/${p.id}`, p.title]], body),
  };
}

function reviewPage(href: Href): StaticPage {
  const body = `
<h1>코드 리뷰 테스트</h1>
<p class="lead">실무 코드에서 자주 지적되는 문제를 개선 패턴으로 익히고, 리뷰 실전 퀴즈에서 문제 있는 줄을 직접 찾아 모범 리뷰 · 베스트 개선안과 비교합니다.</p>
${REVIEW_FRAMEWORKS.map((f) => {
  const c = REVIEW_CONTENT[f.id];
  return `<h2>${esc(f.title)}</h2><p>${esc(f.subtitle)}</p><h3>개선 패턴</h3>${list(
    c.patterns.map((p) => `<a href="${href(`review/pattern/${p.id}`)}">${esc(p.title)}</a> — ${esc(p.summary)}`),
  )}<h3>리뷰 실전 퀴즈</h3>${list(c.challenges.map((ch) => `<a href="${href(`review/challenge/${ch.id}`)}">${esc(ch.title)}</a> (${DIFFICULTY[ch.difficulty]})`))}`;
}).join('\n')}`;
  return {
    path: 'review',
    title: '코드 리뷰 테스트 — 개선 패턴과 리뷰 실전 퀴즈',
    description: `${REVIEW_FRAMEWORKS.map((f) => f.title).join(', ')} 실무 코드의 개선 패턴 ${CONTENT_STATS.patterns}개와 리뷰 실전 퀴즈 ${CONTENT_STATS.challenges}개로 코드 리뷰를 연습합니다.`,
    html: layout(href, [['review', '코드 리뷰']], body),
  };
}

function reviewPatternPage(href: Href, p: ReviewPattern): StaticPage {
  const f = REVIEW_FRAMEWORK_MAP[p.framework];
  const body = `
<h1>${esc(p.title)}</h1>
<p class="lead">${esc(p.summary)} <span class="tag">${esc(p.subFramework ?? f.title)} · ${esc(REVIEW_CATEGORY_LABEL[p.category])} · ${DIFFICULTY[p.difficulty]}</span></p>
<h2>문제 상황</h2>
${rich(p.problem, 3)}
<h2>개선 전</h2>
${codeBlock(p.before.source, p.before.language, p.before.filename)}
<h2>개선 후</h2>
${codeBlock(p.after.source, p.after.language, p.after.filename)}
<h2>개선 포인트</h2>
${rich(p.explanation, 3)}
<h2>리뷰 체크리스트</h2>
${list(p.checklist.map(inline))}`;
  return {
    path: `review/pattern/${p.id}`,
    title: `${p.title} — ${f.title} 코드 리뷰 개선 패턴`,
    description: `${p.summary} ${describe(p.problem, 100)}`.slice(0, 160),
    html: layout(href, [['review', '코드 리뷰'], [`review/pattern/${p.id}`, p.title]], body),
  };
}

function challengePage(href: Href, ch: ReviewChallenge): StaticPage {
  const f = REVIEW_FRAMEWORK_MAP[ch.framework];
  const body = `
<h1>${esc(ch.title)}</h1>
<p class="lead"><span class="tag">${esc(ch.subFramework ?? f.title)} 리뷰 실전 퀴즈 · ${DIFFICULTY[ch.difficulty]}</span></p>
<h2>상황</h2>
${rich(ch.context, 3)}
<h2>리뷰할 코드</h2>
${codeBlock(ch.code.source, ch.code.language, ch.code.filename)}
<h2>${esc(ch.question.prompt)}</h2>
${list(ch.question.options.map((o) => inline(o.text)))}
<p>앱에서 문제가 있는 줄을 고르고 문제점을 선택하면, 채점과 함께 모범 리뷰 코멘트와 베스트 개선안을 볼 수 있습니다.</p>`;
  return {
    path: `review/challenge/${ch.id}`,
    title: `${ch.title} — ${f.title} 리뷰 실전 퀴즈`,
    description: `${describe(ch.context, 90)} ${f.title} 코드에서 문제가 되는 줄을 찾고 개선점을 고르는 코드 리뷰 실전 퀴즈입니다.`.trim(),
    html: layout(href, [['review', '코드 리뷰'], [`review/challenge/${ch.id}`, ch.title]], body),
  };
}

function interviewPage(href: Href): StaticPage {
  const body = `
<h1>기술 면접 CS</h1>
<p class="lead">이론으로 익히고, 퀴즈로 확인하고, 질문 카드로 말하기 연습까지. 카테고리마다 이론 레슨 · 퀴즈 · 면접 질문 카드가 있습니다.</p>
${CS_GROUPS.map((g) => {
  const cats = CS_CATEGORIES.filter((c) => c.group === g.id);
  return `<h2>${esc(g.title)}</h2><p>${esc(g.description)}</p>${list(
    cats.map((c) => {
      const content = CS_CONTENT[c.id];
      return `<a href="${href(`interview/${c.id}`)}">${esc(c.title)}</a> — ${esc(c.description)} (이론 ${content?.lessons?.length ?? 0} · 퀴즈 ${content?.quiz.length ?? 0} · 질문 ${content?.cards.length ?? 0})`;
    }),
  )}`;
}).join('\n')}`;
  return {
    path: 'interview',
    title: '기술 면접 CS — 이론 레슨 · 퀴즈 · 면접 질문 카드',
    description: `운영체제 · 네트워크 · 데이터베이스부터 언어 · 프레임워크 · 웹 프론트엔드까지 ${CS_CATEGORIES.length}개 카테고리의 이론 레슨 ${CONTENT_STATS.lessons}개와 면접 질문 카드 ${CONTENT_STATS.cards}장.`,
    html: layout(href, [['interview', '면접 CS']], body),
  };
}

function categoryPage(href: Href, categoryId: string): StaticPage {
  const c = CS_CATEGORY_MAP[categoryId];
  const content = CS_CONTENT[categoryId];
  const lessons = content?.lessons ?? [];
  const body = `
<h1>${esc(c.title)}</h1>
<p class="lead">${esc(c.description)}</p>
${lessons.length ? `<h2>이론 학습 ${lessons.length}개</h2>${list(lessons.map((l, i) => `${i + 1}. <a href="${href(`interview/lesson/${l.id}`)}">${esc(l.title)}</a> (${DIFFICULTY[l.difficulty]} · ${l.minutes}분) — ${inline(l.summary)}`))}` : ''}
${content?.cards.length ? `<h2>면접 질문 ${content.cards.length}개</h2>${list(content.cards.map((card) => esc(card.question)))}` : ''}
${content?.quiz.length ? `<p>앱에서 이 카테고리의 퀴즈 ${content.quiz.length}문항을 풀고, 면접 질문 카드로 모범 답변 · 핵심 키워드 · 꼬리 질문과 답변을 연습할 수 있습니다.</p>` : ''}`;
  return {
    path: `interview/${categoryId}`,
    title: `${c.title} — 기술 면접 CS 이론 · 면접 질문`,
    description: `${c.description}. 이론 레슨 ${lessons.length}개와 면접 질문 ${content?.cards.length ?? 0}개로 ${c.title} 면접을 준비합니다.`,
    html: layout(href, [['interview', '면접 CS'], [`interview/${categoryId}`, c.title]], body),
  };
}

function lessonPage(href: Href, l: CsLesson): StaticPage {
  const c = CS_CATEGORY_MAP[l.categoryId];
  const siblings = CS_CONTENT[l.categoryId]?.lessons ?? [];
  const i = siblings.findIndex((x) => x.id === l.id);
  const prev = siblings[i - 1];
  const next = siblings[i + 1];
  const nav = [
    prev ? `← 이전 레슨: <a href="${href(`interview/lesson/${prev.id}`)}">${esc(prev.title)}</a>` : '',
    next ? `다음 레슨: <a href="${href(`interview/lesson/${next.id}`)}">${esc(next.title)}</a> →` : '',
  ].filter(Boolean);
  const body = `
<h1>${esc(l.title)}</h1>
<p class="lead">${inline(l.summary)} <span class="tag">${isCaseCategory(l.categoryId) ? '실전 사례 · ' : ''}${esc(c.title)} · 레슨 ${i + 1}/${siblings.length} · ${DIFFICULTY[l.difficulty]} · ${l.minutes}분</span></p>
${rich(l.body, 2)}
<h2>핵심 정리</h2>
${list(l.keyPoints.map(inline))}
${nav.length ? `<p class="pager">${nav.join('<br>')}</p>` : ''}`;
  return {
    path: `interview/lesson/${l.id}`,
    title: `${l.title} — ${c.title} 이론`,
    description: plainText(l.summary).slice(0, 160),
    html: layout(href, [['interview', '면접 CS'], [`interview/${l.categoryId}`, c.title], [`interview/lesson/${l.id}`, l.title]], body),
  };
}

function textPage(href: Href, path: string, title: string, description: string, text: string): StaticPage {
  return { path, title, description, html: layout(href, [[path, title]], `<h1>${esc(title)}</h1>\n${rich(text, 2)}`) };
}

/** 앱 기능 화면 — 콘텐츠가 아니므로 본문을 만들지 않고 검색 결과에서 뺀다 */
const APP_SCREENS: [string, string][] = [
  ['onboarding', '시작하기'],
  ['quiz', '퀴즈'],
  ['cards', '면접 질문 카드'],
  ['settings', '설정'],
  ['bookmarks', '북마크'],
  ['notes', '오답노트'],
  ['me', '마이'],
];

/**
 * 웹에 내보낼 모든 정적 페이지. prefix 는 사이트 루트 경로('/' 또는 '/하위경로/').
 * 콘텐츠 페이지는 sitemap 에 넣고, 앱 기능 화면(noindex)은 넣지 않는다.
 */
export function staticPages(prefix = '/'): StaticPage[] {
  const href: Href = (path) => (path ? `${prefix}${path}/` : prefix);
  return [
    homePage(href),
    algorithmPage(href),
    reviewPage(href),
    interviewPage(href),
    ...ALGO_TOPICS.map((t) => topicPage(href, t.id)),
    ...Object.values(ALGO_PATTERN_MAP).map((p) => patternPage(href, p)),
    ...Object.values(PATTERN_MAP).map((p) => reviewPatternPage(href, p)),
    ...Object.values(CHALLENGE_MAP).map((ch) => challengePage(href, ch)),
    ...CS_CATEGORIES.map((c) => categoryPage(href, c.id)),
    ...ALL_LESSONS.map((l) => lessonPage(href, l)),
    textPage(href, 'about', '서비스 소개', `${SITE_NAME}가 어떤 서비스인지, 콘텐츠를 어떻게 만드는지, 운영자와 문의처를 소개합니다.`, aboutText()),
    textPage(href, 'privacy', '개인정보 처리방침', `${SITE_NAME}의 개인정보 처리방침 — 수집하는 정보, 기기에 저장되는 정보, 광고(Google AdSense · AdMob)와 문의처.`, PRIVACY_POLICY),
    ...APP_SCREENS.map(([path, title]) => ({ path, title, description: SITE_DESCRIPTION, html: '', noindex: true })),
  ];
}

/** 정적 페이지 본문 스타일 — 앱이 뜨기 전(또는 JS 없이) 읽기 좋게. 색은 앱 테마(src/theme/tokens.ts)와 같다 */
export const PRERENDER_STYLE = `<style id="tj-prerender">
.tj-pre{flex:1;height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;background:#F2F4F6;color:#191F28;font:16px/1.75 -apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",sans-serif;word-break:keep-all;overflow-wrap:anywhere}
.tj-pre header{position:sticky;top:0;background:#FFFFFF;border-bottom:1px solid #E5E8EB}
.tj-pre .bar{max-width:760px;margin:0 auto;padding:12px 20px;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}
.tj-pre .brand{font-weight:800;color:inherit;text-decoration:none;margin-right:auto}
.tj-pre nav{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:14px}
.tj-pre nav a{color:#4E5968;text-decoration:none}
.tj-pre main{max-width:760px;margin:0 auto;padding:20px 20px 40px}
.tj-pre h1{font-size:28px;line-height:1.35;margin:8px 0 12px}
.tj-pre h2{font-size:21px;line-height:1.4;margin:32px 0 10px}
.tj-pre h3{font-size:18px;margin:24px 0 8px}
.tj-pre a{color:#3182F6}
.tj-pre h2 a,.tj-pre h3 a{color:inherit}
.tj-pre .lead{color:#4E5968}
.tj-pre .tag{display:inline-block;font-size:13px;color:#8B95A1}
.tj-pre .crumbs{font-size:14px;color:#8B95A1;margin:0}
.tj-pre .crumbs a{color:#8B95A1;text-decoration:none}
.tj-pre .pager{margin-top:32px}
.tj-pre .file{font-size:13px;color:#8B95A1;margin:12px 0 -8px}
.tj-pre pre{background:#191F28;color:#E5E8EB;padding:14px 16px;border-radius:12px;overflow-x:auto;font-size:13px;line-height:1.55;margin:12px 0;word-break:normal;overflow-wrap:normal}
.tj-pre code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:.9em}
.tj-pre :not(pre)>code{background:#E8F3FF;padding:1px 5px;border-radius:5px}
.tj-pre blockquote{margin:16px 0;padding:4px 16px;background:#E8F3FF;border-radius:10px}
.tj-pre table{border-collapse:collapse;display:block;overflow-x:auto;font-size:14px;margin:12px 0}
.tj-pre th,.tj-pre td{border:1px solid #E5E8EB;padding:8px 10px;text-align:left;vertical-align:top;min-width:96px}
.tj-pre ul,.tj-pre ol{padding-left:22px}
.tj-pre li{margin:4px 0}
.tj-pre footer{max-width:760px;margin:0 auto;padding:0 20px 48px;font-size:14px;color:#8B95A1}
.tj-pre footer a{color:#8B95A1}
@media (prefers-color-scheme:dark){
.tj-pre{background:#0E1013;color:#F2F4F6}
.tj-pre header{background:#1A1D22;border-color:#2B3038}
.tj-pre nav a,.tj-pre .lead{color:#B3BAC4}
.tj-pre a{color:#4D94FF}
.tj-pre :not(pre)>code,.tj-pre blockquote{background:#16263D}
.tj-pre th,.tj-pre td{border-color:#2B3038}
}
</style>`;
