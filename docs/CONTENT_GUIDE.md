# 콘텐츠 작성 가이드

앱의 모든 학습 콘텐츠는 `src/content/` 아래 TypeScript 파일로 번들에 포함됩니다.
타입 정의는 [`src/content/types.ts`](../src/content/types.ts)에 있습니다.
콘텐츠를 추가/수정한 뒤에는 반드시 검증 스크립트를 실행하세요.

```bash
npm run validate            # 구조 검증 + 알고리즘 모범 답안 실행 검증(Python/JS/Java/C++)
npm run validate -- --quick # 구조 검증만
```

## 1. 공통 원칙

- **한국어**로 작성합니다. 기술 용어는 실무에서 쓰는 표기를 따릅니다. (예: 트랜잭션, 인덱스, 커넥션 풀)
  처음 등장하는 용어는 필요하면 영문을 괄호로 병기합니다. 예: 격리 수준(Isolation Level)
- 문장은 `~합니다/~입니다` 체를 사용합니다. 면접 모범 답변은 실제로 말하듯 자연스럽게 씁니다.
- 사실 관계가 정확해야 합니다. 버전에 따라 달라지는 내용은 버전을 명시합니다. (예: Java 21의 가상 스레드)
- 외부 문제 사이트(프로그래머스, 백준, LeetCode 등)의 지문을 복제하지 않습니다. 모든 지문은 직접 창작합니다.
- ID는 전역에서 유일해야 합니다.

## 2. RichText (markdown-lite) 문법

`RichText`로 표시된 필드는 아래 문법만 지원합니다. 지원하지 않는 문법은 그대로 글자로 보입니다.

| 문법 | 예시 | 설명 |
| --- | --- | --- |
| 문단 | 빈 줄로 구분 | 문단 안의 줄바꿈은 그대로 줄바꿈 |
| 굵게 | `**중요**` | |
| 인라인 코드 | `` `HashMap` `` | |
| 글머리 목록 | `- 항목` | 줄 맨 앞, 중첩 불가 |
| 번호 목록 | `1. 항목` | 줄 맨 앞, 중첩 불가 |
| 소제목 | `### 제목` | `###`만 지원 |
| 팁 박스 | `> 내용` | 연속된 `>` 줄은 하나의 박스 |
| 코드 블록 | ` ```java ` ... ` ``` ` | 언어: java, kotlin, python, cpp, javascript, typescript, sql, json, yaml, bash, text |
| 표 | `\| a \| b \|` + `\|---\|---\|` | 헤더 1줄 + 구분선 + 본문 (셀 안에는 인라인 문법만) |

**지원하지 않는 문법**: 링크, 이미지, 기울임(`*a*`), 중첩 목록, HTML, `#`/`##` 제목.

선택지(`choices`), 체크리스트, 제한사항(`constraints`), 키워드처럼 한 줄짜리 필드는 **인라인 문법(굵게, 인라인 코드)만** 사용합니다.

### TypeScript 문자열 작성 요령

- 여러 줄 텍스트와 코드는 템플릿 리터럴(백틱)로 작성합니다.
- 템플릿 리터럴 안에서 백틱은 `` \` ``, `${`는 `\${`로 이스케이프합니다.
- 코드(`source`, `solutions`)는 **들여쓰기 없이 첫 열부터** 작성합니다. 앞뒤 공백 줄은 화면에서 자동으로 제거됩니다.

```ts
explanation: `정렬 후 **투 포인터**로 탐색합니다.

- 왼쪽 포인터는 가장 작은 값
- 오른쪽 포인터는 가장 큰 값

\`\`\`python
nums.sort()
\`\`\``,
```

## 3. 퀴즈 (QuizQuestion)

- `mcq`: 선택지 4개를 권장(2~5개). 정답은 `answer`(0부터 시작하는 인덱스).
  - 정답 위치가 한쪽으로 쏠리지 않게 골고루 분포시킵니다.
  - "모두 정답", "정답 없음" 같은 선택지는 피합니다.
  - 오답도 그럴듯해야 합니다(실제로 자주 하는 오해를 오답으로).
- `ox`: `answer: true`는 O(맞는 설명), `false`는 X.
- `explanation`에는 정답 이유와 **오답이 왜 틀렸는지**를 함께 적습니다. 2~6문장 + 필요하면 목록/코드.
- 난이도: 1(신입 기본기) · 2(실무/중급) · 3(심화/경력).

## 4. 면접 질문 카드 (InterviewCard)

- `question`: 실제 면접에서 나오는 형태의 질문. 예: "프로세스와 스레드의 차이를 설명해주세요."
- `answer`: 30초~1분 분량으로 말할 수 있는 모범 답변. 핵심 → 근거 → 실무 예시 순서를 권장합니다.
- `keywords`: 답변에 반드시 들어가야 할 키워드 3~6개.
- `followUps`: 실제로 이어질 법한 꼬리 질문 1~3개.

## 5. 코드 리뷰

- **ReviewPattern(개선 패턴 학습)**: 실무 코드 리뷰에서 자주 지적되는 패턴 하나에 집중합니다.
  `before`/`after` 코드는 15~45줄 내외로, 핵심이 드러나도록 작성합니다.
- **ReviewChallenge(리뷰 실전 퀴즈)**: 실제 서비스 코드처럼 보이는 30~70줄 코드에 2~4개의 이슈를 숨깁니다.
  - `issues[].lines`는 `code.source` 기준 1부터 시작하는 라인 번호이며, 검증 스크립트가 범위를 확인합니다.
  - `question.options`는 5~6개, 그중 정답(`correct: true`) 2~4개. 오답 선택지는 코드에 실제로 없는 문제여야 합니다.
  - `improved`는 모든 이슈를 해결한 베스트 개선안입니다.

## 6. 알고리즘 코딩 문제 (AlgoProblem)

프로그래머스 스타일의 `solution` 함수 형식을 사용합니다.

| ValueType | Python | JavaScript | Java | C++ |
| --- | --- | --- | --- | --- |
| `int` | int | number | int | int |
| `long` | int | number | long | long long |
| `double` | float | number | double | double |
| `bool` | bool | boolean | boolean | bool |
| `string` | str | string | String | string |
| `int[]` | list[int] | number[] | int[] | vector&lt;int&gt; |
| `long[]` | list[int] | number[] | long[] | vector&lt;long long&gt; |
| `double[]` | list[float] | number[] | double[] | vector&lt;double&gt; |
| `bool[]` | list[bool] | boolean[] | boolean[] | vector&lt;bool&gt; |
| `string[]` | list[str] | string[] | String[] | vector&lt;string&gt; |
| `int[][]` | list[list[int]] | number[][] | int[][] | vector&lt;vector&lt;int&gt;&gt; |
| `string[][]` | list[list[str]] | string[][] | String[][] | vector&lt;vector&lt;string&gt;&gt; |

- 모범 답안 형식
  - Python: `def solution(...):`
  - JavaScript: `function solution(...) { }`
  - Java: `class Solution { public <반환타입> solution(...) { } }` (필요한 `import`는 맨 위에)
  - C++: `#include` + `using namespace std;` + `<반환타입> solution(...) { }`
- `long` 값은 JavaScript 안전 정수 범위(±9,007,199,254,740,991)를 넘지 않게 합니다.
- 테스트 데이터는 앱 번들에 포함되므로 문제당 JSON 크기 15KB 이내로 유지합니다.
- `tests`에는 경계값(최소 입력, 최대에 가까운 입력, 중복, 음수 등)을 포함합니다.
- `compare: 'unordered'`는 1차원 배열 반환에서 순서를 무시할 때만 사용합니다.
