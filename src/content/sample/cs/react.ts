// 공개 저장소용 샘플 콘텐츠 — `npm run content:sample` 로 생성. 전체 콘텐츠는 비공개 저장소에 있습니다.
import type { CsCategoryContent } from '@/content/types';

const content: CsCategoryContent = {
  lessons: [
    {
      id: 'cs-react-l01',
      categoryId: 'react',
      title: '렌더링과 재조정: 가상 DOM과 key',
      summary: 'React가 화면을 갱신하는 과정(트리거 → 렌더 → 커밋), 이전 트리와 새 트리를 비교하는 재조정 규칙, 목록에서 `key`가 하는 일을 이해합니다.',
      difficulty: 1,
      minutes: 5,
      body: `### 왜 필요한가요?
"리렌더링이 너무 많아요", "목록에서 항목을 지웠더니 입력값이 엉뚱한 줄에 남아요", "조건 하나 바꿨더니 입력하던 내용이 사라졌어요". React에서 만나는 버그와 성능 고민의 상당수는 **React가 언제, 어떻게 화면을 다시 그리는지** 모르는 데서 시작합니다.

### 핵심 개념: 트리거 → 렌더 → 커밋
React가 화면을 바꾸는 과정은 세 단계입니다.

1. **트리거**: 첫 마운트, 또는 state 변경이 렌더링을 예약합니다.
2. **렌더**: React가 컴포넌트 함수를 호출해 새 React 엘리먼트 트리를 만듭니다. 화면을 어떻게 그릴지 적은 자바스크립트 객체 트리로, 흔히 가상 DOM이라고 부릅니다. 이 단계에서는 DOM을 건드리지 않습니다.
3. **커밋**: 이전 트리와 비교해 찾은 차이만 실제 DOM에 반영하고, 그다음 effect를 실행합니다.

즉 **렌더링 = 컴포넌트 함수 호출**입니다. 렌더링이 일어나도 결과가 같으면 DOM은 바뀌지 않습니다.

처음 마운트된 뒤 컴포넌트가 다시 렌더링되는 계기는 세 가지입니다. 그 컴포넌트가 가진 state가 바뀌거나, 위쪽의 어느 조상이 렌더링되면서 이 컴포넌트까지 다시 호출하거나, 이 컴포넌트가 \`useContext\`로 읽는 값이 바뀌는 경우입니다.

두 번째가 특히 중요합니다. 부모가 렌더링되면 자식은 받은 props가 이전과 똑같아도 **기본적으로 함께 렌더링됩니다.** React는 props가 같은지 따로 확인하지 않습니다. 같은 props일 때 건너뛰게 하려면 자식을 \`React.memo\`로 감싸야 하며, 그 조건은 리렌더링 최적화 레슨에서 다룹니다.

### 재조정(Reconciliation) 규칙
두 트리를 완벽하게 비교하는 일반 알고리즘은 O(n³)이라 화면 갱신에 쓰기에는 너무 느립니다. React는 몇 가지 가정을 두고 O(n)에 비교합니다.

- **타입이 다르면 다른 트리입니다.** 같은 자리에 오는 엘리먼트의 종류가 \`div\`에서 \`section\`으로, \`<Counter>\`에서 \`<Timer>\`로 달라지면 React는 이전 것을 고쳐 쓰지 않습니다. 그 아래를 전부 언마운트하고 처음부터 마운트하므로, 하위 컴포넌트들이 가지고 있던 state도 함께 초기화됩니다.
- **타입이 같으면 유지합니다.** DOM 노드와 컴포넌트 인스턴스(state 포함)를 그대로 두고 바뀐 속성만 갱신합니다.
- **형제 목록은 key로 짝을 맞춥니다.**

정리하면 state는 컴포넌트 함수가 아니라 **트리 안의 위치**에 붙어 있습니다. 같은 자리에 같은 타입이 렌더링되는 동안만 유지됩니다.

### key가 하는 일
목록을 비교할 때 React는 key가 같은 엘리먼트를 '같은 항목'으로 보고 DOM과 state를 재사용합니다.

| key 선택 | 결과 |
|---|---|
| 데이터의 고유 id | 삽입 · 삭제 · 정렬해도 각 항목의 DOM과 state가 제 짝을 찾음 |
| 배열 인덱스 | 순서가 바뀌면 다른 항목이 같은 key를 물려받아, 입력값 같은 DOM 상태가 엉뚱한 항목 옆에 남음 |
| \`Math.random()\` | 렌더링마다 key가 바뀌어 모든 항목을 새로 만들고 state를 잃음 |

예를 들어 인덱스 key 목록에서 첫 항목을 지우면, 두 번째 항목이 key 0을 물려받습니다. React는 key 0의 \`li\`를 재사용해 텍스트만 바꾸고 마지막 key의 \`li\`를 제거하므로, 첫 줄의 \`input\`에 입력해 둔 값이 이제 두 번째 항목 옆에 보입니다. 그래서 인덱스를 key로 써도 되는 것은 항목이 추가 · 삭제되거나 재정렬될 일이 없는 정적인 목록뿐입니다.

key는 목록 밖에서도 쓸 수 있습니다. \`<ProfileForm key={userId} />\`처럼 key를 바꾸면 React는 다른 컴포넌트로 보고 새로 마운트하므로, 사용자가 바뀔 때 폼 state를 깔끔하게 초기화할 수 있습니다.

### 예시: 같은 자리, 같은 타입
\`\`\`tsx
// TextField 는 입력값을 자기 state 로 가진다
function NameField({ isCompany }: { isCompany: boolean }) {
  return isCompany ? <TextField label="회사명" /> : <TextField label="이름" />;
}
\`\`\`

\`isCompany\`가 바뀌어도 같은 자리에 같은 타입 \`TextField\`가 있으므로 React는 같은 컴포넌트로 보고 state를 유지합니다. 레이블만 바뀌고 입력하던 값은 그대로 남습니다. 서로 다른 필드로 다루려면 \`key="company"\`, \`key="person"\`처럼 다른 key를 줍니다. 반대로 \`TextField\`를 감싸는 요소가 조건에 따라 \`div\` ↔ \`section\`처럼 바뀌면, 그 아래 전체가 새로 만들어져 입력값이 초기화됩니다.

### 면접에서는
- "가상 DOM은 왜 빠른가요?"에는 '항상 빠르다'가 아니라, 선언적으로 작성해도 바뀐 부분만 DOM에 반영해 **충분히 빠르게** 해 준다고 답합니다.
- 렌더 단계와 커밋 단계를 구분하고, 렌더링이 곧 DOM 갱신은 아니라는 점을 짚습니다.
- key 질문에는 인덱스 key가 문제를 일으키는 구체적인 장면(삭제 · 정렬 시 입력값이 남음)을 예로 듭니다.`,
      keyPoints: [
        '화면 갱신은 트리거 → 렌더(컴포넌트 함수 호출) → 커밋(DOM 반영) 순서로 일어납니다',
        '부모가 렌더링되면 자식도 props와 관계없이 함께 렌더링되며, 건너뛰려면 `memo`가 필요합니다',
        '같은 자리에서 엘리먼트 타입이 바뀌면 하위 트리와 그 안의 state가 모두 새로 만들어집니다',
        'state는 트리 안의 위치에 붙어 있고, 목록에서는 key로 항목의 짝을 맞춥니다',
        'key는 데이터의 고유 id를 쓰고, key를 바꾸면 컴포넌트를 초기화할 수 있습니다',
      ],
    },
    {
      id: 'cs-react-l02',
      categoryId: 'react',
      title: 'Hooks 규칙과 상태: useState · useRef · 배칭',
      summary: 'Hook을 최상위에서만 호출해야 하는 이유, state가 렌더링마다의 스냅샷이라는 의미, 자동 배칭과 `useRef`, 제어 컴포넌트를 정리합니다.',
      difficulty: 1,
      minutes: 6,
      body: `### 왜 필요한가요?
\`setCount\`를 세 번 불렀는데 1만 늘어나고, 조건문 안에 Hook을 넣었더니 "Rendered more hooks than during the previous render" 에러가 납니다. Hook은 평범한 함수처럼 보이지만 React가 정한 규칙 위에서 동작합니다.

### Hook 규칙과 호출 순서
Hook 규칙은 두 가지입니다.

1. **최상위에서만 호출합니다.** 조건문 · 반복문 · 중첩 함수 안이나 이른 \`return\` 뒤에서 호출하지 않습니다.
2. **함수 컴포넌트나 커스텀 Hook 안에서만** 호출합니다.

React 입장에서 Hook은 이름 없는 칸입니다. 첫 번째로 호출된 \`useState\`는 1번 칸, 두 번째는 2번 칸… 하는 식으로 컴포넌트마다 칸을 차례로 배정하고, 다음 렌더링에서도 **같은 순번으로** 칸을 찾아갑니다. 어떤 렌더링에서 조건 때문에 Hook 하나를 건너뛰면 그 뒤 Hook들은 한 칸씩 앞당겨진, 남의 칸을 읽게 됩니다. 그래서 이 규칙은 성능이나 문법 제약이 아니라 **순서 의존** 때문이고, 렌더링마다 같은 순서로만 호출되면 꼭 함수 첫 줄일 필요는 없습니다. \`eslint-plugin-react-hooks\`가 위반을 잡아 주며, React 19의 \`use\`는 조건문 안에서도 호출할 수 있는 예외입니다.

커스텀 Hook(\`useXxx\`)으로 묶어도 이 규칙은 그대로입니다. 두 컴포넌트가 같은 커스텀 Hook을 부르면 각 컴포넌트에 별도의 칸이 생기므로, 공유되는 것은 코드이지 state가 아닙니다.

### state는 렌더링마다의 스냅샷
\`useState\`가 돌려주는 값은 **그 렌더링 시점에 고정된 값**입니다. setter는 변수를 즉시 바꾸지 않고 "다음 렌더링에서는 이 값을 써 달라"고 예약합니다.

\`\`\`tsx
const [count, setCount] = useState(0);

function handleClick() {
  setCount(count + 1); // 이번 렌더링 내내 count 는 0
  console.log(count);  // 0
}
\`\`\`

이전 값을 기준으로 여러 번 바꾸려면 **함수형 업데이트** \`setCount((c) => c + 1)\`을 씁니다. React가 대기열에 쌓인 함수를 차례로 적용하므로 세 번 부르면 3이 늘어납니다.

- 객체 · 배열 state는 직접 고치지 말고 **새 객체**로 바꿉니다(\`setUser({ ...user, name })\`). React는 \`Object.is\`로 이전 값과 비교해 같으면 렌더링을 건너뛸 수 있습니다.
- 비싼 초깃값은 \`useState(() => loadDraft())\`처럼 함수로 넘기면 첫 렌더링에만 계산합니다.

### 배칭
React는 한 작업 안의 여러 state 업데이트를 모아 **렌더링을 한 번만** 합니다. 이를 배칭(batching)이라고 하며, 중간 값이 화면에 잠깐 보이는 일은 없습니다.

| 버전 | 배칭 범위 |
|---|---|
| React 17 이하 (또는 18의 레거시 \`ReactDOM.render\`) | React 이벤트 핸들러 안의 업데이트만 |
| React 18+ (\`createRoot\`) | \`setTimeout\`, Promise, 네이티브 이벤트 등 **어디서든** 자동 배칭 |

몇 개의 state를 건드렸는지는 상관없습니다. 하나의 이벤트(또는 타이머 콜백) 안에서 일어난 업데이트라면 모두 한 번의 렌더링으로 합쳐집니다. 업데이트 직후 DOM을 바로 측정해야 하는 드문 경우에만 \`react-dom\`의 \`flushSync\`로 즉시 반영합니다.

### useRef: 렌더링과 무관한 상자
\`useRef\`는 렌더링이 반복돼도 **같은 객체**를 돌려주는 상자입니다. \`ref.current\`를 바꿔도 React는 알지 못하므로 다시 렌더링하지 않습니다.

| | state | ref |
|---|---|---|
| 바꾸면 리렌더링 | 예 | 아니오 |
| 읽는 값 | 렌더링 시점의 스냅샷 | 언제나 최신 \`current\` |
| 용도 | 화면에 보이는 값 | DOM 요소, 타이머 id, \`AbortController\` |

화면에 보여야 하는 값을 ref에 두면 다른 이유로 렌더링될 때까지 갱신되지 않습니다. 또 렌더링 중에 \`ref.current\`를 읽거나 쓰지 말고 이벤트 핸들러 · effect 안에서 다룹니다.

### 제어 컴포넌트와 비제어 컴포넌트
- **제어 컴포넌트**: \`value\` + \`onChange\`로 입력값을 state에 묶습니다. React state가 단일 진실 공급원이 되어 즉시 검증 · 포맷팅이 쉽지만, 키 입력마다 리렌더링됩니다.
- **비제어 컴포넌트**: \`defaultValue\`로 시작하고 DOM이 값을 가지며, 필요할 때 ref로 읽습니다. 필드가 많은 폼에서 React Hook Form이 이 방식을 씁니다.

\`value\`만 주고 \`onChange\`를 빠뜨리면 React가 값을 고정해 버려, 타이핑해도 글자가 바뀌지 않는 읽기 전용 필드가 되고 콘솔에 경고가 뜹니다. 또 \`useState()\`처럼 초깃값을 비워 두면 처음에는 비제어였다가 입력 후 제어로 바뀌었다는 경고가 나므로, 문자열 입력은 \`''\`에서 시작합니다.

### 면접에서는
- "Hook을 조건문에 쓰면 안 되는 이유"는 **호출 순서로 state를 찾는다**는 한 문장이 핵심입니다.
- \`setState\` 직후 값이 그대로인 이유를 '비동기라서'로만 말하기보다 **스냅샷과 업데이트 예약**으로 설명하면 정확합니다.
- React 18 자동 배칭이 무엇을 바꿨는지(이벤트 핸들러 밖까지 확대)를 버전과 함께 말합니다.`,
      keyPoints: [
        'Hook은 최상위에서만 호출합니다. React가 **호출 순서**로 각 Hook의 state를 찾기 때문입니다',
        'state는 렌더링마다 고정된 스냅샷이고, setter는 다음 렌더링을 예약할 뿐입니다',
        '이전 값 기준으로 여러 번 바꿀 때는 함수형 업데이트 `setX((prev) => ...)`를 씁니다',
        'React 18의 `createRoot`에서는 타이머 · Promise 안의 업데이트도 자동으로 배칭됩니다',
        '`useRef`는 바꿔도 리렌더링되지 않으므로 화면에 보일 값은 state로 둡니다',
      ],
    },
    {
      id: 'cs-react-l03',
      categoryId: 'react',
      title: 'useEffect 제대로 쓰기',
      summary: 'effect는 외부 시스템과 동기화하는 도구입니다. 의존성 배열, 정리 함수의 실행 시점, StrictMode의 이중 실행, 오래된 클로저, effect가 필요 없는 경우를 정리합니다.',
      difficulty: 2,
      minutes: 6,
      body: `### 왜 필요한가요?
\`useEffect\`는 가장 많이 쓰이면서 가장 많이 오용되는 Hook입니다. 의존성을 빠뜨려 오래된 값을 읽고, 정리 함수를 빼먹어 구독이 쌓이고, 계산하면 될 값을 effect로 state에 복사해 렌더링을 두 번 합니다. 출발점은 effect의 목적을 정확히 아는 것입니다.

### 핵심 개념: 외부 시스템과의 동기화
렌더링은 순수한 계산이어야 합니다. 하지만 컴포넌트는 채팅 서버 연결, 브라우저 이벤트 구독, 타이머, 지도 위젯처럼 **React 바깥의 시스템**과 맞춰야 할 때가 있습니다. effect는 이런 동기화 코드를 **커밋 이후**(화면 반영 뒤)에 실행하는 자리입니다.

\`\`\`tsx
useEffect(() => {
  const conn = createConnection(roomId); // 설정
  conn.connect();
  return () => conn.disconnect();        // 정리
}, [roomId]);                            // 의존성
\`\`\`

### 의존성 배열
| 작성 | 실행 시점 |
|---|---|
| 생략 | 매 렌더링 후 |
| \`[]\` | 마운트 후 한 번 |
| \`[a, b]\` | 마운트 후, 그리고 \`a\`나 \`b\`가 \`Object.is\` 기준으로 바뀐 렌더링 후 |

규칙은 단순합니다. effect 안에서 읽는 props · state · 컴포넌트 안의 함수는 **모두** 의존성에 넣습니다. 실행 조건을 고르는 옵션이 아니라, 코드가 읽는 값을 정직하게 적는 목록입니다. \`eslint-plugin-react-hooks\`의 \`exhaustive-deps\` 규칙이 누락을 알려 줍니다.

### 정리 함수의 실행 시점
정리 함수는 두 시점에 실행됩니다.

1. 의존성이 바뀌어 effect가 **다시 실행되기 직전**
2. 컴포넌트가 **언마운트될 때**

위 코드에서 \`roomId\`가 \`x\`로 마운트된 뒤 \`y\`로 바뀌고 언마운트되면 순서는 \`x 연결\` → \`x 해제\` → \`y 연결\` → \`y 해제\`입니다. 새 연결보다 이전 정리가 먼저입니다. 정리 함수도 클로저라서, 그것이 만들어진 렌더링 시점의 \`roomId\`(이전 방)를 들고 있으므로 엉뚱한 방을 끊지 않습니다.

### StrictMode의 이중 실행 (개발 모드)
개발 모드에서 \`<StrictMode>\`로 감싼 컴포넌트는 처음 마운트된 직후 React가 일부러 한 번 떼었다가 다시 붙입니다(React 18+). 그래서 effect가 설정 → 정리 → 설정 순으로 실행됩니다. 정리 함수가 제대로 되어 있다면 사용자 입장에서 차이가 없어야 하므로, 이 과정에서 문제가 보이면 정리 누락이 있다는 뜻입니다. 이 재마운트는 **프로덕션 빌드에서는 일어나지 않습니다.** 개발 중 API가 두 번 호출된다고 StrictMode를 끄거나 ref 플래그로 막지 말고, 정리 로직(구독 해제, 요청 취소)을 고칩니다.

### 오래된 클로저(stale closure)
effect 안의 함수는 만들어진 렌더링의 값을 클로저로 붙잡습니다. 의존성을 \`[]\`로 두고 그 안에서 state를 읽으면, effect가 다시 만들어지지 않으므로 첫 렌더링의 값을 계속 읽습니다.

\`\`\`tsx
useEffect(() => {
  const id = setInterval(() => setSeconds(seconds + 1), 1000); // seconds 는 계속 0
  return () => clearInterval(id);
}, []);
\`\`\`

이 타이머는 멈추지 않고 매초 \`setSeconds(1)\`만 반복해 화면이 1에 머뭅니다. 고치는 가장 쉬운 방법은 effect가 \`seconds\`를 읽지 않게 만드는 것입니다. \`setSeconds((s) => s + 1)\`은 React가 최신 값을 넣어 주므로 클로저에 갇힌 값과 상관없습니다. 의존성에 \`seconds\`를 넣는 방법도 값은 맞게 나오지만, 1초마다 effect가 정리되고 다시 실행되어 interval을 매번 새로 만드는 셈입니다.

### effect가 필요 없는 경우
| 하고 싶은 일 | effect 대신 |
|---|---|
| 장바구니 합계처럼 props · state에서 나오는 값 | 컴포넌트 본문에서 바로 계산, 정말 무거우면 \`useMemo\` |
| '주문하기'를 누른 뒤 요청 · 토스트 | 그 버튼의 이벤트 핸들러 |
| \`userId\`가 바뀌면 폼 state 초기화 | \`<Form key={userId} />\`로 새로 마운트 |
| 서버 데이터 가져오기 | TanStack Query 같은 라이브러리, 프레임워크의 데이터 로딩 |

파생 값을 effect에서 \`setState\`로 넣으면, 원본이 바뀐 렌더링에서는 아직 예전 결과가 화면에 나가고 그 뒤 effect의 setState가 렌더링을 **한 번 더** 일으킵니다. 같은 화면을 두 번 그리는 셈이고, 그 사이 잠깐 틀린 값이 보입니다. \`useLayoutEffect\`로 옮기면 깜빡임은 가려지지만 두 번 렌더링하는 낭비는 그대로입니다.

effect로 직접 데이터를 가져와야 한다면, 응답 순서가 뒤바뀌는 경쟁 상태를 정리 함수에서 막습니다(\`AbortController\`로 취소하거나 플래그로 늦은 응답 무시). \`useLayoutEffect\`는 화면이 그려지기 전에 레이아웃을 측정해야 할 때만 씁니다.

### 면접에서는
- "useEffect는 언제 쓰나요?"에는 **외부 시스템과의 동기화**라는 정의와, 쓰지 않아도 되는 경우를 함께 말합니다.
- 개발 중 effect가 두 번 실행되는 현상을 StrictMode와 연결해 설명할 수 있어야 합니다.
- 의존성 배열을 '언제 실행할지 고르는 스위치'로 다루는 것이 가장 흔한 오해입니다.`,
      keyPoints: [
        'effect는 React 바깥 시스템과 동기화하는 도구이며 커밋 이후에 실행됩니다',
        'effect 안에서 읽는 props · state · 함수는 모두 의존성 배열에 넣습니다',
        '정리 함수는 다음 effect 실행 직전과 언마운트 때 실행됩니다',
        'StrictMode의 설정 → 정리 → 설정 이중 실행은 개발 모드에서만 일어납니다',
        '계산할 수 있는 값 · 이벤트 처리 · state 초기화에는 effect가 필요 없습니다',
      ],
    },
    {
      id: 'cs-react-l04',
      categoryId: 'react',
      title: '리렌더링 최적화와 Context',
      summary: '메모이제이션 전에 렌더링 범위부터 줄이는 방법, `memo` · `useMemo` · `useCallback`이 효과를 내는 조건(얕은 비교), Context가 리렌더링을 일으키는 방식을 배웁니다.',
      difficulty: 2,
      minutes: 6,
      body: `### 왜 필요한가요?
입력창에 한 글자 칠 때마다 수백 개의 카드가 다시 렌더링되어 타이핑이 버벅입니다. \`memo\`를 붙였는데도 그대로입니다. 최적화 도구가 **무엇을 비교하는지** 모르면 붙여도 효과가 없고 코드만 복잡해집니다.

### 먼저 측정하고, 렌더링 범위부터 줄이기
렌더링은 함수 호출이고 DOM은 바뀐 부분만 갱신되므로, 리렌더링이 일어났다는 사실만으로 느려지지는 않습니다. React DevTools Profiler로 실제로 오래 걸리는 컴포넌트를 찾은 뒤 손을 댑니다.

메모이제이션보다 먼저 시도할 것은 **구조 변경**입니다.

\`\`\`tsx
// 전: color 가 바뀔 때마다 ExpensiveTree 도 렌더링
function Page() {
  const [color, setColor] = useState('red');
  return (
    <div style={{ color }}>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      <ExpensiveTree />
    </div>
  );
}

// 후: 상태를 쓰는 부분만 분리하고, 무거운 트리는 children 으로 받음
function ColorBox({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState('red');
  return (
    <div style={{ color }}>
      <input value={color} onChange={(e) => setColor(e.target.value)} />
      {children}
    </div>
  );
}

function Page() {
  return (
    <ColorBox>
      <ExpensiveTree />
    </ColorBox>
  );
}
\`\`\`

\`ColorBox\`의 state가 바뀌어도 \`children\`은 \`Page\`가 이미 만들어 둔 엘리먼트라 참조가 같으므로, React는 \`ExpensiveTree\`를 다시 렌더링하지 않습니다. 상태를 쓰는 곳 가까이로 **내리는 것**만으로 해결되는 경우가 많습니다.

### memo · useMemo · useCallback
| 도구 | 기억하는 것 | 쓸모 있는 경우 |
|---|---|---|
| \`React.memo(Component)\` | 이전 props | props가 같으면 컴포넌트 렌더링을 건너뜀 |
| \`useMemo(fn, deps)\` | 계산 결과 | 무거운 계산, \`memo\` 자식에 넘길 객체 · 배열 |
| \`useCallback(fn, deps)\` | 함수 자체 | \`memo\` 자식에 넘기거나 effect 의존성으로 쓰는 함수 |

\`useCallback(fn, deps)\`는 \`useMemo(() => fn, deps)\`와 같은 일을 합니다.

\`memo\`가 하는 비교는 prop마다 \`Object.is\`로 '같은 참조인가'만 보는 **얕은 비교**입니다. JSX에 \`style={{ padding: 4 }}\`라고 쓰면 렌더링할 때마다 내용은 같지만 새 객체가 만들어지고, 컴포넌트 본문에서 선언한 화살표 함수도 매번 새 함수입니다. 이런 prop이 하나만 섞여 있어도 비교는 매번 '다름'으로 끝나, \`memo\`는 비교만 하고 렌더링은 그대로 하는 손해가 됩니다. 바뀌지 않는 값은 컴포넌트 밖 상수로 빼고, 나머지는 \`useMemo\` · \`useCallback\`으로 참조를 고정합니다. 내용을 깊이 들여다보는 비교가 아니므로, 객체가 크다고 비교 방식이 달라지지도 않습니다.

반대로 \`memo\`로 감싸지 않은 자식에게 \`useCallback\` 함수를 넘기는 것은 효과가 없습니다. 자식은 부모가 렌더링되면 props와 관계없이 함께 렌더링되기 때문입니다. 메모이제이션은 비교 비용 · 메모리 · 의존성 관리 부담이 있으므로 효과가 확인된 곳에만 씁니다.

> React Compiler(2025년 10월 1.0 출시)를 도입하면 이런 메모이제이션을 빌드 단계에서 자동으로 넣어 줍니다. 그래도 얕은 비교와 참조 동일성을 알아야 결과를 이해하고 문제를 진단할 수 있습니다.

### Context와 리렌더링
Provider의 \`value\`가 \`Object.is\` 기준으로 바뀌면, 그 Context를 \`useContext\`로 읽는 **모든 컴포넌트**가 다시 렌더링됩니다.

- Context는 값 전체를 한 덩어리로 다루고, 필요한 필드만 구독하는 방법이 없습니다. \`{ user, theme }\`를 한 Context에 담으면 \`theme\`만 바뀌어도 \`user\`만 쓰는 컴포넌트까지 렌더링됩니다.
- \`memo\`가 보는 것은 부모에게 받은 props뿐이라, 컴포넌트 안에서 \`useContext\`로 구독한 값이 바뀌어 일어나는 렌더링은 걸러 내지 못합니다.
- \`value={{ user, setUser }}\`처럼 객체 리터럴을 넘기면 Provider가 렌더링될 때마다 새 값이 됩니다.
- Provider의 \`children\`은 바깥에서 만든 엘리먼트라서, Context를 읽지 않는 자식은 Provider의 state가 바뀌어도 다시 렌더링되지 않습니다.

개선 방법은 바뀌는 빈도가 다른 값을 **Context별로 나누고**, \`value\`를 \`useMemo\`로 고정하고, 갱신 함수는 별도 Context로 분리하는 것입니다. 자주 바뀌고 여러 곳에서 일부만 읽는 전역 상태라면 셀렉터로 필요한 값만 구독하는 Zustand 같은 외부 스토어가 더 맞습니다.

### 면접에서는
- "memo를 붙였는데도 리렌더링돼요"에는 인라인 객체 · 함수 props, Context 구독, \`children\`으로 넘기는 JSX를 차례로 확인한다고 답합니다.
- 최적화 순서는 **측정 → 구조 개선 → 메모이제이션**이라는 점을 강조합니다.
- \`memo\`가 깊은 비교를 한다거나, \`useCallback\`만으로 자식 렌더링이 줄어든다는 오해에 주의합니다.`,
      keyPoints: [
        '최적화는 Profiler로 측정한 뒤, 상태 내리기 · `children` 전달 같은 구조 개선부터 합니다',
        '`memo`는 props를 `Object.is`로 얕게 비교하므로 인라인 객체 · 함수가 있으면 효과가 없습니다',
        '`useCallback`은 `memo` 자식에 넘기거나 effect 의존성으로 쓸 때만 의미가 있습니다',
        'Context `value`가 바뀌면 그 Context를 읽는 모든 컴포넌트가 렌더링되며 `memo`로 막을 수 없습니다',
        '자주 바뀌는 값은 Context를 나누거나 셀렉터를 지원하는 외부 스토어로 옮깁니다',
      ],
    },
    {
      id: 'cs-react-l05',
      categoryId: 'react',
      title: '동시성 기능과 서버 컴포넌트',
      summary: 'React 18의 동시성 렌더링(`useTransition` · `useDeferredValue` · Suspense)이 해결하는 문제와, 서버 컴포넌트 · 클라이언트 컴포넌트의 경계 규칙을 정리합니다.',
      difficulty: 3,
      minutes: 6,
      body: `### 왜 필요한가요?
검색어를 입력할 때마다 결과 목록 1만 개를 다시 그리면 키 입력이 늦게 찍힙니다. React 17까지 렌더링은 한번 시작하면 끝날 때까지 **멈출 수 없었기** 때문입니다. 또 페이지 전체를 클라이언트 컴포넌트로 만들면 데이터를 보여 주기만 하는 코드까지 모두 번들에 실려 브라우저로 내려갑니다. React 18의 동시성 기능과 서버 컴포넌트는 이 두 문제를 겨냥합니다.

### 동시성 렌더링과 전환
React 18부터 렌더링은 **중단 가능**합니다. React는 업데이트를 두 종류로 나눕니다.

- **긴급 업데이트**: 타이핑, 클릭처럼 즉시 반응해야 하는 것
- **전환(transition)**: 결과 목록 갱신, 탭 내용 교체처럼 조금 늦어도 되는 것

\`\`\`tsx
const [isPending, startTransition] = useTransition();

function onChange(e: ChangeEvent<HTMLInputElement>) {
  setText(e.target.value); // 긴급: 입력창은 즉시
  startTransition(() => {
    setQuery(e.target.value); // 전환: 무거운 목록은 여유 있을 때
  });
}
\`\`\`

전환 렌더링은 작업을 잘게 나눠 중간중간 브라우저에 제어권을 넘기며 진행하고, 그 사이 새 입력이 오면 진행 중이던 렌더링을 **버리고** 최신 값으로 다시 시작합니다. 전환이 끝나기 전까지 \`isPending\`은 \`true\`입니다. 자주 하는 오해를 정리합니다.

- 별도 스레드(웹 워커)로 옮겨 가는 것이 아닙니다. 작업은 여전히 **메인 스레드**에서 돌고, React가 작업 사이사이에 브라우저에 차례를 양보할 뿐이라 목록 계산 자체에 드는 시간은 그대로입니다.
- 타이머로 일정 시간 미루는 디바운스와도 다릅니다. 브라우저가 한가하면 지연 없이 곧바로 렌더링하므로, 서버 요청 횟수를 줄이는 목적이라면 디바운스를 따로 걸어야 합니다.
- 입력창에 묶인 state까지 전환에 넣으면 글자가 늦게 찍히는 역효과가 납니다. 입력값은 긴급 업데이트로 남겨 둡니다.

값을 props로 받는 쪽에서는 \`useDeferredValue(query)\`로 '조금 늦게 따라오는 값'을 만들어 같은 효과를 냅니다.

### Suspense: 선언적 로딩 경계
\`<Suspense fallback={<Spinner />}>\`는 하위 컴포넌트가 렌더링 도중 아직 준비되지 않았다며 **일시 중단(suspend)**하면 그동안 폴백을 보여 줍니다. 일시 중단을 일으키는 것은 정해져 있습니다.

- \`React.lazy\`로 불러오는 컴포넌트의 코드
- Suspense를 지원하는 데이터 소스: Next.js 같은 프레임워크의 데이터 로딩, TanStack Query의 \`useSuspenseQuery\`, React 19의 \`use\`로 읽는 Promise 등

\`useEffect\` 안에서 \`fetch\`해 state에 넣는 컴포넌트는 일시 중단하지 않으므로 \`Suspense\`로 감싸도 폴백이 나오지 않습니다. 컴포넌트는 빈 상태로 그냥 렌더링되고, effect가 나중에 데이터를 채울 뿐입니다.

이미 보이던 내용이 전환 중에 다시 일시 중단되면 React는 폴백으로 갈아 끼우지 않고 기존 화면을 유지합니다. 로딩과 짝을 이루는 실패 처리는 **에러 바운더리**가 맡습니다. 하위 트리의 렌더링 중 에러를 잡아 폴백 UI로 바꾸지만, 이벤트 핸들러나 비동기 콜백에서 난 에러는 잡지 못합니다.

### 서버 컴포넌트
React Server Components(RSC)는 React 19에서 안정화되었고, Next.js App Router에서는 모든 컴포넌트가 기본적으로 서버 컴포넌트입니다.

| | 서버 컴포넌트 | 클라이언트 컴포넌트 (\`'use client'\`) |
|---|---|---|
| 실행 위치 | 서버에서만 | 첫 요청 때 서버에서 HTML로 렌더링 + 브라우저에서 하이드레이션 |
| 할 수 있는 일 | \`async\`로 DB · 내부 API 직접 조회, 비밀 키 사용 | state, effect, 이벤트 핸들러, 브라우저 API |
| JS 번들 | 포함되지 않음 | 포함됨 |

경계에서 지킬 규칙이 있습니다.

- \`'use client'\` 한 줄은 컴포넌트 하나가 아니라 **파일(모듈) 단위의 경계**를 긋습니다. 이 파일과, 이 파일이 import하는 모듈 전체가 브라우저용 번들에 포함됩니다.
- 그래서 클라이언트 컴포넌트 파일에서 서버 컴포넌트를 import하면 그것도 클라이언트 코드로 끌려 들어갑니다. 서버 컴포넌트를 안에 두려면 \`children\` 같은 props 자리로 받습니다.
- 경계를 넘는 props는 네트워크로 전달되므로 문자열 · 숫자 · 배열 · 일반 객체처럼 **직렬화할 수 있어야** 합니다. 이벤트 핸들러 같은 일반 함수는 보낼 수 없고, \`'use server'\`로 표시한 Server Function만 넘길 수 있습니다.

SSR과 혼동하지 않아야 합니다. SSR은 미리 만든 HTML에 이벤트를 붙이기 위해 결국 **모든** 컴포넌트의 JS를 내려보냅니다. 반면 서버 컴포넌트의 코드는 브라우저에 아예 도착하지 않고, 하이드레이션 대상에서도 빠집니다. 그래서 데이터를 읽어 그리는 부분은 서버 컴포넌트로 두고, 상호작용이 필요한 작은 조각(버튼, 입력 폼)에만 \`'use client'\`를 붙이는 구성이 기본입니다.

### 면접에서는
- \`useTransition\`과 디바운스의 차이(정해진 대기 시간 vs 중단 가능한 우선순위)를 구분해 말합니다.
- "클라이언트 컴포넌트는 브라우저에서만 렌더링된다"는 대표적인 오해입니다. 첫 요청 때는 서버에서도 HTML로 렌더링됩니다.
- 서버 컴포넌트와 SSR의 차이를 **번들 크기 · 하이드레이션** 관점에서 설명할 수 있어야 합니다.`,
      keyPoints: [
        'React 18부터 렌더링은 중단 가능하며, 업데이트를 긴급 업데이트와 전환으로 나눕니다',
        '`startTransition`은 메인 스레드에서 우선순위를 낮출 뿐, 웹 워커나 디바운스가 아닙니다',
        'Suspense 폴백은 하위 컴포넌트가 일시 중단할 때만 나오며, effect 안의 `fetch`는 일시 중단하지 않습니다',
        '서버 컴포넌트는 서버에서만 실행되어 번들에 포함되지 않고, `\'use client\'`는 모듈 경계를 표시합니다',
        '클라이언트 컴포넌트도 첫 요청 때는 서버에서 HTML로 렌더링된 뒤 하이드레이션됩니다',
      ],
    },
  ],
  quiz: [
    {
      id: 'cs-react-q01',
      categoryId: 'react',
      lessonId: 'cs-react-l01',
      type: 'ox',
      difficulty: 1,
      prompt: '부모 컴포넌트가 다시 렌더링되어도, 자식 컴포넌트는 전달받은 props가 바뀌지 않았다면 다시 렌더링되지 않는다.',
      answer: false,
      explanation: `React는 기본적으로 컴포넌트가 렌더링되면 그 아래 **모든 자식 컴포넌트를 다시 렌더링**합니다. props가 같은지 비교해서 건너뛰는 것은 자식을 \`React.memo\`로 감쌌을 때만 일어납니다.

컴포넌트가 다시 렌더링되는 경우는 크게 세 가지입니다.

- 자신의 state가 바뀔 때
- 부모 컴포넌트가 다시 렌더링될 때
- 구독 중인 Context 값이 바뀔 때

> 여기서 렌더링은 컴포넌트 함수를 다시 호출하는 것이지 DOM을 다시 그리는 것이 아닙니다. React는 결과를 이전과 비교(재조정)해 **바뀐 부분만** DOM에 반영하므로, 리렌더링 자체가 곧 성능 문제는 아닙니다. 느린 것이 확인된 곳에만 \`memo\`를 적용합니다.`,
      tags: [
        'rendering',
        'memo',
      ],
    },
    {
      id: 'cs-react-q02',
      categoryId: 'react',
      lessonId: 'cs-react-l02',
      type: 'mcq',
      difficulty: 1,
      prompt: '버튼을 **한 번** 클릭한 뒤 화면에 표시되는 값은?',
      code: {
        language: 'tsx',
        source: `function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  };

  return <button onClick={handleClick}>{count}</button>;
}`,
      },
      correct: '`1`',
      distractors: [
        {
          text: '`3`',
          why: '세 줄 모두 이번 렌더링의 스냅샷 `count`(0)를 읽으므로 `setCount(1)`을 세 번 예약할 뿐입니다. 3이 되려면 함수형 업데이트 `setCount((c) => c + 1)`을 써야 합니다.',
        },
        {
          text: '`0`',
          why: '`setCount`는 값을 즉시 바꾸지 않을 뿐, 다음 렌더링을 예약합니다. 클릭 직후 다시 렌더링되므로 화면이 0에 머무르지 않습니다.',
        },
        {
          text: '렌더링이 세 번 일어나 `1`, `2`, `3`이 차례로 표시된다',
          why: '이벤트 핸들러 안의 여러 업데이트는 배칭되어 렌더링은 한 번만 일어납니다. 또 세 호출 모두 같은 값 1을 예약하므로 2나 3이 될 수도 없습니다.',
        },
        {
          text: 'React 17까지는 `3`, React 18부터는 `1`',
          why: 'state가 렌더링마다의 스냅샷이라는 점은 버전과 상관없습니다. React 17에서도 이벤트 핸들러 안의 업데이트는 배칭되었고, 세 호출 모두 `setCount(0 + 1)`이라 결과는 1입니다.',
        },
        {
          text: '렌더링 중에 setter를 여러 번 불러 무한 렌더링 에러가 난다',
          why: '`setCount`는 렌더링 중이 아니라 클릭 이벤트 핸들러 안에서 호출됩니다. "Too many re-renders" 에러는 컴포넌트 본문에서 렌더링하는 도중에 setter를 호출할 때 납니다.',
        },
      ],
      explanation: `state는 렌더링마다 고정된 **스냅샷**입니다. 이번 렌더링에서 \`count\`는 0이므로 세 줄 모두 \`setCount(0 + 1)\`을 예약하고, 결과는 \`1\`입니다.

- \`setCount\`는 값을 즉시 바꾸지 않고 **다음 렌더링을 예약**합니다. 그래서 호출 직후 \`console.log(count)\`를 찍으면 이전 값이 나옵니다.
- 이벤트 핸들러 안의 여러 업데이트는 **배칭**되어 렌더링은 한 번만 일어납니다.
- 이전 값을 기준으로 여러 번 바꾸려면 **함수형 업데이트**를 씁니다. React가 대기열의 업데이트를 순서대로 적용하므로 \`3\`이 됩니다.

\`\`\`tsx
setCount((c) => c + 1);
setCount((c) => c + 1);
setCount((c) => c + 1); // 3
\`\`\``,
      tags: [
        'useState',
        'functional-update',
        'batching',
      ],
    },
    {
      id: 'cs-react-q06',
      categoryId: 'react',
      lessonId: 'cs-react-l01',
      type: 'mcq',
      difficulty: 2,
      prompt: '`장보기` 옆 입력창에 `우유`를 입력한 뒤 **첫 항목 삭제**를 누르면 화면은 어떻게 될까요?',
      code: {
        language: 'tsx',
        source: `function TodoList() {
  const [todos, setTodos] = useState([
    { id: 'a', text: '장보기' },
    { id: 'b', text: '운동' },
  ]);

  return (
    <>
      <ul>
        {todos.map((todo, index) => (
          <li key={index}>
            {todo.text} <input placeholder="메모" />
          </li>
        ))}
      </ul>
      <button onClick={() => setTodos((prev) => prev.slice(1))}>첫 항목 삭제</button>
    </>
  );
}`,
      },
      correct: '`운동` 옆 입력창에 `우유`가 그대로 남아 있다',
      distractors: [
        {
          text: '`장보기`와 입력값 `우유`가 함께 사라지고, `운동` 옆 입력창은 비어 있다',
          why: '`key={todo.id}`처럼 고유 id를 key로 썼을 때의 결과입니다. 인덱스 key에서는 삭제 후 `운동`이 key 0을 물려받아, `우유`가 들어 있는 첫 번째 `li`의 DOM을 재사용합니다.',
        },
        {
          text: '`장보기`와 입력값 `우유`는 남고 `운동` 줄이 사라진다',
          why: 'React가 마지막 key의 `li`를 제거하는 것은 맞지만, 텍스트는 새 데이터로 다시 그립니다. 남은 첫 번째 `li`의 텍스트는 `운동`으로 바뀝니다.',
        },
        {
          text: 'key가 바뀌어 React가 에러를 내고 렌더링을 중단한다',
          why: '인덱스 key도 형제 사이에서 겹치지 않으므로 React는 에러나 경고 없이 렌더링합니다. 문제는 조용히 엉뚱한 DOM이 재사용된다는 점입니다.',
        },
        {
          text: '`운동` 옆 입력창에 `우유`가 남고, 그 아래에 텍스트 없는 빈 입력창이 하나 더 남는다',
          why: '삭제 후 목록에 없는 key 1의 `li`는 React가 DOM에서 제거합니다. 화면에는 `운동` 줄 하나만 남습니다.',
        },
        {
          text: '두 `li`가 모두 제거되어 목록이 빈다',
          why: '삭제 후에도 key 0이 남아 있어 React는 첫 번째 `li`를 재사용하고, 새 배열에는 `운동`이 남아 있으므로 목록이 비지 않습니다.',
        },
      ],
      explanation: `React는 재조정할 때 **key가 같은 엘리먼트를 같은 항목**으로 보고 DOM과 상태를 재사용합니다.

- 삭제 전: key 0 = 장보기, key 1 = 운동
- 삭제 후: key 0 = 운동

React는 key 0이 그대로 있으니 첫 번째 \`li\`의 텍스트만 \`운동\`으로 바꾸고, 사라진 key 1의 \`li\`를 제거합니다. \`input\`은 첫 번째 \`li\`의 DOM을 그대로 재사용하므로 입력값 \`우유\`가 \`운동\` 옆에 남습니다.

\`key={todo.id}\`처럼 항목마다 **변하지 않는 고유 값**을 써야 삭제한 항목의 입력창이 함께 사라집니다. 인덱스 key는 순서가 바뀌거나 삽입 · 삭제되지 않는 고정 목록에서만 안전하고, \`Math.random()\`은 렌더링마다 모든 항목을 새로 만들어 상태를 잃게 합니다.`,
      tags: [
        'key',
        'reconciliation',
        'list',
      ],
    },
    {
      id: 'cs-react-q16',
      categoryId: 'react',
      lessonId: 'cs-react-l01',
      type: 'mcq',
      difficulty: 2,
      prompt: '`CouponInput`은 입력값을 자기 state로 갖고 있습니다. 쿠폰 코드를 입력하던 중 `isMember`가 바뀌면 입력하던 값은 어떻게 될까요? 결과와 그 이유로 옳은 것을 고르세요.',
      code: {
        language: 'tsx',
        source: `function Checkout({ isMember }: { isMember: boolean }) {
  return isMember ? (
    <div className="member">
      <CouponInput />
    </div>
  ) : (
    <section>
      <CouponInput />
    </section>
  );
}`,
      },
      correct: '감싸는 요소의 타입이 `div`에서 `section`으로 바뀌어 하위 트리가 새로 만들어지므로 입력값이 초기화된다',
      distractors: [
        {
          text: '같은 `CouponInput` 컴포넌트가 같은 자리에 있으므로 입력값이 유지된다',
          why: '`CouponInput` 자체의 타입은 같아도, 그 위의 부모 엘리먼트 타입이 바뀌면 아래 하위 트리 전체가 새로 만들어집니다. state는 트리 안의 위치에 붙어 있기 때문입니다.',
        },
        {
          text: 'key를 지정하지 않았으므로 React가 경고를 내고 입력값을 유지한다',
          why: 'key 경고는 배열로 렌더링하는 목록에서 나는 것이라 이 코드와 관계가 없습니다.',
        },
        {
          text: '`className`만 달라졌으므로 React가 속성만 갱신하고 입력값은 유지된다',
          why: '속성만 갱신하는 것은 타입이 같을 때의 동작입니다. 여기서는 `className`보다 먼저 태그 자체가 `div`와 `section`으로 다릅니다.',
        },
        {
          text: '삼항 연산자로 조건부 렌더링한 컴포넌트는 조건이 바뀔 때마다 항상 새로 마운트되므로 입력값이 초기화된다',
          why: '삼항 연산자 자체는 초기화와 관계가 없습니다. 조건이 바뀌어도 같은 자리에 같은 타입이 오면 state는 유지되고, 이 코드는 감싸는 요소의 타입이 달라서 초기화됩니다.',
        },
        {
          text: '`isMember` prop이 바뀌어 `Checkout`이 새로 마운트되므로 입력값이 초기화된다',
          why: 'props가 바뀌어도 `Checkout`은 언마운트되지 않고 다시 렌더링될 뿐입니다. 새로 만들어지는 것은 타입이 바뀐 `div` ↔ `section`과 그 아래 트리입니다.',
        },
      ],
      explanation: `React는 같은 자리의 엘리먼트 **타입**부터 비교합니다. \`isMember\`가 바뀌면 그 자리의 타입이 \`div\` ↔ \`section\`으로 달라지므로, React는 기존 하위 트리를 통째로 언마운트하고 새로 만듭니다. 그 안의 \`CouponInput\`도 새로 마운트되어 state가 초깃값으로 돌아갑니다. state는 컴포넌트가 아니라 **트리 안의 위치**에 붙어 있기 때문입니다.

입력값을 유지하려면 감싸는 요소를 같은 타입으로 두고 속성만 바꿉니다.

\`\`\`tsx
<div className={isMember ? 'member' : undefined}>
  <CouponInput />
</div>
\`\`\``,
      tags: [
        'reconciliation',
        'state-preservation',
      ],
    },
    {
      id: 'cs-react-q03',
      categoryId: 'react',
      lessonId: 'cs-react-l02',
      type: 'mcq',
      difficulty: 1,
      prompt: '다음 컴포넌트는 Hook 규칙을 어기고 있습니다. 이 규칙이 필요한 이유로 가장 정확한 것은?',
      code: {
        language: 'tsx',
        source: `function Profile({ user }: { user: User | null }) {
  if (!user) {
    return <p>로그인이 필요합니다</p>;
  }

  const [tab, setTab] = useState('posts');
  return <ProfileTabs user={user} tab={tab} onChange={setTab} />;
}`,
      },
      correct: 'React는 Hook을 호출 순서로 구분하므로, 렌더링마다 순서가 달라지면 state가 엉뚱한 Hook에 연결되기 때문에',
      distractors: [
        {
          text: 'Hook은 호출 비용이 커서 렌더링마다 호출 여부가 달라지면 성능이 떨어지기 때문에',
          why: '성능 때문이 아닙니다. 규칙의 이유는 React가 Hook의 state를 호출 순서로 찾는다는 데 있습니다.',
        },
        {
          text: '조건문 뒤에 있는 Hook은 빌드 과정에서 제거되어 동작하지 않기 때문에',
          why: '빌드 도구는 Hook을 제거하지 않습니다. 조건에 따라 호출되면 렌더링마다 Hook의 개수와 순서가 달라지는 것이 문제입니다.',
        },
        {
          text: '`useState`는 문법상 컴포넌트 함수의 첫 줄에서만 호출할 수 있기 때문에',
          why: '첫 줄일 필요는 없습니다. 렌더링마다 같은 순서로 호출되기만 하면 다른 코드 뒤에 있어도 됩니다.',
        },
        {
          text: 'React가 Hook을 변수 이름(`tab`)으로 구분하는데, 조건문 뒤에서는 이름을 알 수 없기 때문에',
          why: 'React는 Hook이나 변수의 이름을 전혀 알지 못합니다. 이름이 없으니 호출된 순서로만 각 Hook의 state를 구분합니다.',
        },
        {
          text: '이른 `return`을 만나면 컴포넌트가 언마운트되어 state가 모두 사라지기 때문에',
          why: '이른 `return`은 다른 JSX를 반환할 뿐 컴포넌트를 언마운트하지 않습니다. 컴포넌트는 그대로 있고, 렌더링마다 호출되는 Hook의 개수가 달라지는 것이 문제입니다.',
        },
        {
          text: 'TypeScript가 조건부 Hook 호출을 타입 에러로 막기 때문에',
          why: 'TypeScript는 Hook 규칙을 검사하지 않습니다. 이 규칙은 런타임의 호출 순서 때문에 필요하고, 위반은 `eslint-plugin-react-hooks`가 잡아 줍니다.',
        },
      ],
      explanation: `React는 Hook에 이름을 붙이지 않고, 컴포넌트마다 Hook의 state를 **호출된 순서대로** 저장해 두었다가 다음 렌더링에서 같은 순서로 꺼내 씁니다. 위 코드는 \`user\`가 \`null\`인 렌더링에서 \`useState\`를 건너뛰므로 렌더링마다 Hook의 개수와 순서가 달라집니다. 그러면 state가 엉뚱한 Hook에 연결되거나 버려지고, React가 "Rendered more hooks than during the previous render" 같은 에러를 내기도 합니다.

- Hook은 **컴포넌트 최상위**에서, 조건문 · 반복문 · 이른 \`return\`보다 **앞에서** 호출합니다. 위 코드는 \`useState\`를 \`if\` 위로 올리거나, 로그인 후 화면을 별도 컴포넌트로 분리해 고칩니다.

> \`eslint-plugin-react-hooks\`의 \`rules-of-hooks\` 규칙이 이런 실수를 잡아 줍니다. React 19의 \`use\`는 예외적으로 조건문 안에서도 호출할 수 있습니다.`,
      tags: [
        'hooks',
        'rules-of-hooks',
      ],
    },
    {
      id: 'cs-react-q04',
      categoryId: 'react',
      lessonId: 'cs-react-l02',
      type: 'ox',
      difficulty: 1,
      prompt: '`useRef`로 만든 ref의 `current`를 바꿔도 컴포넌트가 다시 렌더링되지 않으므로, 화면에 보여야 하는 값은 ref가 아니라 state로 관리해야 한다.',
      answer: true,
      explanation: `\`useRef\`는 렌더링 사이에 **같은 객체**를 유지하는 상자이고, \`current\`를 바꿔도 React는 이를 알지 못해 리렌더링을 예약하지 않습니다. 그래서 화면에 표시하는 값을 ref에 두면 다른 이유로 렌더링될 때까지 화면이 갱신되지 않습니다.

ref는 화면과 관계없지만 렌더링 사이에 유지해야 하는 값에 씁니다.

- DOM 요소 참조 (포커스, 스크롤, 크기 측정)
- \`setInterval\` id, \`AbortController\` 같은 핸들
- 이벤트 콜백에서 읽을 최신 값 보관

> 렌더링 중에 \`ref.current\`를 읽거나 쓰면 결과를 예측하기 어려워지므로, ref는 이벤트 핸들러와 effect 안에서 다루는 것이 원칙입니다(최초 1회 초기화는 예외).`,
      tags: [
        'useRef',
      ],
    },
    {
      id: 'cs-react-q07',
      categoryId: 'react',
      lessonId: 'cs-react-l03',
      type: 'mcq',
      difficulty: 2,
      prompt: '`roomId`가 `a`로 마운트된 뒤 `b`로 바뀌고, 이후 컴포넌트가 언마운트됩니다. 콘솔 출력 순서는? (프로덕션 빌드)',
      code: {
        language: 'tsx',
        source: `function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    console.log('connect', roomId);
    return () => console.log('disconnect', roomId);
  }, [roomId]);

  return <h1>{roomId}</h1>;
}`,
      },
      correct: '`connect a` → `disconnect a` → `connect b` → `disconnect b`',
      distractors: [
        {
          text: '`connect a` → `connect b` → `disconnect b`',
          why: '의존성이 바뀌면 새 effect를 실행하기 직전에 이전 effect의 정리 함수가 먼저 실행되므로 `disconnect a`가 빠지지 않습니다.',
        },
        {
          text: '`connect a` → `connect b` → `disconnect a` → `disconnect b`',
          why: '정리 함수는 새 effect보다 먼저 실행됩니다. 이 순서라면 잠시 두 방에 동시에 연결된 상태가 됩니다.',
        },
        {
          text: '`connect a` → `disconnect a` → `connect b`',
          why: '정리 함수는 언마운트 때도 실행되므로 마지막 연결을 끊는 `disconnect b`가 빠지지 않습니다.',
        },
        {
          text: '`connect a` → `disconnect b` → `connect b` → `disconnect b`',
          why: '정리 함수도 클로저라서 자신을 만든 렌더링의 `roomId`를 기억합니다. 첫 effect의 정리 함수는 최신 값 `b`가 아니라 `a`로 실행됩니다.',
        },
        {
          text: '`connect a` → `connect b` → `disconnect b` → `disconnect a`',
          why: '`a`의 연결은 `roomId`가 `b`로 바뀔 때 이미 정리됩니다. 언마운트 때는 마지막으로 실행된 effect의 정리 함수 하나만 실행됩니다.',
        },
        {
          text: '`connect a` → `disconnect a` → `connect a` → `disconnect a` → `connect b` → `disconnect b`',
          why: '마운트 직후 설정 → 정리 → 설정을 한 번 더 하는 것은 개발 모드의 `StrictMode`에서만 일어납니다. 프로덕션 빌드에서는 effect가 마운트 때 한 번만 실행됩니다.',
        },
      ],
      explanation: `정리(cleanup) 함수는 두 시점에 실행됩니다.

1. 의존성이 바뀌어 effect가 **다시 실행되기 직전**
2. 컴포넌트가 **언마운트될 때**

그래서 \`roomId\`가 바뀌면 이전 방의 연결을 먼저 끊고(\`disconnect a\`) 새 방에 연결(\`connect b\`)하며, 언마운트 때 마지막 연결을 끊습니다(\`disconnect b\`). 정리 함수는 자신을 만든 렌더링의 \`roomId\`를 클로저로 기억하므로 이전 값 \`a\`로 정리합니다.

> 개발 모드의 \`StrictMode\`에서는 마운트 직후 \`connect a\` → \`disconnect a\` → \`connect a\`가 한 번 더 일어납니다.`,
      tags: [
        'useEffect',
        'cleanup',
      ],
    },
    {
      id: 'cs-react-q08',
      categoryId: 'react',
      lessonId: 'cs-react-l03',
      type: 'ox',
      difficulty: 2,
      prompt: '`<StrictMode>`로 감싼 앱에서 컴포넌트가 마운트될 때 effect가 "설정 → 정리 → 설정" 순서로 한 번 더 실행되는 동작은 프로덕션 빌드에서도 똑같이 일어난다.',
      answer: false,
      explanation: `이 이중 실행은 **개발 모드에서만** 일어납니다(React 18+). React가 일부러 마운트 → 언마운트 → 마운트를 흉내 내서, 정리 함수를 빠뜨린 effect를 개발 중에 드러내기 위한 장치입니다. 같은 목적으로 StrictMode는 개발 모드에서 컴포넌트 함수 본문과 \`useState\` · \`useMemo\`의 초기화 함수도 두 번 호출해 렌더링이 순수한지 확인합니다.

- 두 번 실행되어 문제가 생긴다면 정리 함수가 없다는 신호입니다. 구독은 해제하고, 요청은 \`AbortController\`로 취소하거나 플래그로 늦게 온 결과를 버리도록 고칩니다.
- \`useRef\` 플래그로 두 번째 실행을 막는 것은 증상만 가리는 방법이라 권장하지 않습니다.

> 개발 중 API가 두 번 호출되는 것을 보고 StrictMode를 끄는 경우가 많은데, 프로덕션에는 영향이 없으니 정리 로직을 고치는 쪽이 맞습니다.`,
      tags: [
        'strict-mode',
        'useEffect',
      ],
    },
    {
      id: 'cs-react-q09',
      categoryId: 'react',
      lessonId: 'cs-react-l03',
      type: 'mcq',
      difficulty: 2,
      prompt: '코드 리뷰에서 가장 먼저 제안할 개선으로 적절한 것은?',
      code: {
        language: 'tsx',
        source: `function CartSummary({ items }: { items: CartItem[] }) {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setTotal(items.reduce((sum, item) => sum + item.price * item.qty, 0));
  }, [items]);

  return <p>합계: {total.toLocaleString()}원</p>;
}`,
      },
      correct: '`total` state와 effect를 없애고 렌더링 중에 `items`로 바로 계산한다',
      distractors: [
        {
          text: '의존성 배열을 `[]`로 바꿔 effect가 한 번만 실행되게 한다',
          why: '마운트 때 한 번만 계산하므로 `items`가 바뀌어도 합계가 갱신되지 않는 버그가 됩니다.',
        },
        {
          text: '`useEffect`를 `useLayoutEffect`로 바꿔 합계가 늦게 바뀌는 깜빡임을 없앤다',
          why: '화면에 그리기 전에 다시 렌더링해 깜빡임은 가려지지만, `items`가 바뀔 때마다 두 번 렌더링하는 낭비는 그대로입니다.',
        },
        {
          text: '`setTotal`을 함수형 업데이트 `setTotal((prev) => ...)`로 바꾼다',
          why: '함수형 업데이트는 이전 state를 기준으로 계산할 때 쓰는 것입니다. 합계는 이전 합계가 아니라 `items`로 계산하므로 이 문제와 관계가 없습니다.',
        },
        {
          text: '의존성 배열을 지워 렌더링마다 합계를 다시 계산하게 한다',
          why: '렌더링이 끝날 때마다 effect가 실행될 뿐, 오래된 합계로 먼저 렌더링한 뒤 `setTotal`로 한 번 더 렌더링하는 구조는 그대로입니다.',
        },
        {
          text: '`total`을 state 대신 `useRef`에 두고 effect에서 갱신해 추가 렌더링을 없앤다',
          why: '`ref.current`를 바꿔도 다시 렌더링되지 않으므로, 커밋 뒤 effect에서 계산한 합계가 다음 렌더링 전까지 화면에 반영되지 않습니다.',
        },
        {
          text: '합계 계산 함수를 `useCallback`으로 감싸 effect 의존성에 넣는다',
          why: '함수의 참조만 고정할 뿐, 계산 결과를 state에 복사해 한 번 더 렌더링하는 구조는 그대로입니다.',
        },
      ],
      explanation: `\`total\`은 \`items\`만 있으면 계산할 수 있는 **파생 값**이라 state로 둘 필요가 없습니다. 지금 코드는 \`items\`가 바뀌면 오래된 합계로 한 번 렌더링 · 커밋한 뒤, effect에서 \`setTotal\`을 호출해 **한 번 더 렌더링**합니다.

\`\`\`tsx
const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
\`\`\`

계산이 정말 무겁다면 그때 \`useMemo\`로 감쌉니다.

> effect는 네트워크 · 브라우저 API · 서드파티 위젯 같은 **외부 시스템과 동기화**할 때 씁니다. props로 값 계산하기, 사용자 이벤트에 따른 처리(이벤트 핸들러에 작성), prop이 바뀔 때 state 초기화(\`key\` 사용)에는 effect가 필요 없습니다.`,
      tags: [
        'useEffect',
        'derived-state',
      ],
    },
    {
      id: 'cs-react-q11',
      categoryId: 'react',
      lessonId: 'cs-react-l04',
      type: 'mcq',
      difficulty: 2,
      prompt: '검색어를 입력할 때마다 `memo`로 감싼 `ProductCard`가 모두 다시 렌더링됩니다. 원인과 해결로 옳은 것은?',
      code: {
        language: 'tsx',
        source: `const ProductCard = memo(function ProductCard({ product, style, onSelect }: CardProps) {
  return (
    <button style={style} onClick={() => onSelect(product.id)}>
      {product.name}
    </button>
  );
});

function ProductList({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('');
  const handleSelect = (id: string) => console.log(id);

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      {products.map((p) => (
        <ProductCard key={p.id} product={p} style={{ margin: 8 }} onSelect={handleSelect} />
      ))}
    </>
  );
}`,
      },
      correct: '`style` 객체와 `handleSelect` 함수가 렌더링마다 새로 만들어져 비교에 실패하므로, 상수로 빼거나 `useCallback`으로 참조를 고정한다',
      distractors: [
        {
          text: '`memo`는 부모의 state 변경에는 동작하지 않으므로 `ProductCard`를 `useMemo`로 감싸야 한다',
          why: '`memo`는 바로 부모 리렌더링으로 생기는 자식 렌더링을 건너뛰게 하는 도구입니다. 다만 props가 실제로 같아야 효과가 있습니다.',
        },
        {
          text: '`key`에 `p.id`를 썼기 때문이며, 인덱스로 바꾸면 해결된다',
          why: 'key는 목록 항목을 식별하는 값이라 `memo`의 props 비교와 관계가 없습니다. 인덱스로 바꾸면 오히려 삽입 · 삭제 때 다른 버그가 생깁니다.',
        },
        {
          text: '`memo`는 props를 깊은 비교하므로 `product` 객체가 크면 비교를 포기하고 다시 렌더링한다',
          why: '`memo`는 prop마다 `Object.is`로 참조만 보는 얕은 비교를 하며, 객체 크기에 따라 비교 방식이 달라지지 않습니다.',
        },
        {
          text: '`product` 객체가 렌더링마다 새로 만들어지므로 `products`를 `useMemo`로 감싼다',
          why: '`product`는 props로 받은 `products` 배열의 원소라, 검색어만 바뀌는 렌더링에서는 이전과 같은 참조입니다. 매번 새로 만들어지는 것은 `style`과 `handleSelect`입니다.',
        },
        {
          text: '`ProductCard` 안의 `onClick` 화살표 함수를 `useCallback`으로 감싸면 해결된다',
          why: '그 함수는 `ProductCard`가 렌더링될 때 안에서 만들어지므로, `ProductCard` 렌더링을 건너뛸지 정하는 props 비교와 관계가 없습니다.',
        },
        {
          text: '`handleSelect`만 `useCallback`으로 감싸면 해결된다',
          why: '`style={{ margin: 8 }}`도 렌더링마다 새 객체라 props 하나가 여전히 달라집니다. 비교가 성공하려면 모든 prop의 참조가 같아야 합니다.',
        },
      ],
      explanation: `\`memo\`는 이전 props와 새 props를 **얕게(\`Object.is\`) 비교**해 모두 같을 때만 렌더링을 건너뜁니다. 객체 리터럴 \`{ margin: 8 }\`과 컴포넌트 안에서 선언한 \`handleSelect\`는 렌더링마다 **새 참조**라 비교가 항상 실패하고, \`memo\`는 비교 비용만 더하는 셈이 됩니다.

\`\`\`tsx
const CARD_STYLE = { margin: 8 }; // 컴포넌트 밖 상수
const handleSelect = useCallback((id: string) => console.log(id), []);
\`\`\`

> 메모이제이션은 비교 비용 · 메모리 · 의존성 관리 부담이 있어 공짜가 아닙니다. Profiler로 느린 곳을 확인한 뒤 적용하고, 그 전에 입력 state를 별도 컴포넌트로 내려 렌더링 범위를 줄이는 방법도 검토합니다.`,
      tags: [
        'memo',
        'useCallback',
        'performance',
      ],
    },
    {
      id: 'cs-react-q13',
      categoryId: 'react',
      lessonId: 'cs-react-l04',
      type: 'mcq',
      difficulty: 3,
      prompt: '`theme`만 바꿨는데 `user`만 읽는 `UserBadge`까지 다시 렌더링됩니다. 이에 대한 설명으로 옳은 것은?',
      code: {
        language: 'tsx',
        source: `const AppContext = createContext<AppValue | null>(null);

function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>('light');

  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

function UserBadge() {
  const { user } = useContext(AppContext)!;
  return <span>{user?.name}</span>;
}`,
      },
      correct: 'Context 값이 바뀌면 그 Context를 읽는 컴포넌트가 모두 다시 렌더링되므로, 자주 바뀌는 값은 별도 Context로 나누고 `value`는 `useMemo`로 고정한다',
      distractors: [
        {
          text: '`UserBadge`를 `memo`로 감싸면 Context 값 변경으로 인한 리렌더링도 막을 수 있다',
          why: '`memo`는 부모에게 받은 props만 비교합니다. 컴포넌트 안에서 `useContext`로 읽는 값이 바뀌면 `memo`로 감싸도 다시 렌더링됩니다.',
        },
        {
          text: 'Provider가 렌더링되면 `children`으로 받은 컴포넌트는 Context를 읽지 않아도 무조건 함께 다시 렌더링된다',
          why: '`children`은 `AppProvider`의 부모가 만든 엘리먼트라 Provider의 state가 바뀌어도 참조가 같습니다. 그래서 Context를 읽지 않는 자식은 다시 렌더링되지 않습니다.',
        },
        {
          text: 'React는 Context 값을 깊은 비교하므로 `user`가 그대로라면 리렌더링되지 않아야 하며, 이 현상은 React의 버그다',
          why: 'Context 값은 깊은 비교가 아니라 `Object.is` 참조 비교입니다. 렌더링마다 새 객체를 `value`로 넘기므로 정상 동작입니다.',
        },
        {
          text: '`value`를 `useMemo`로 고정하기만 하면 `theme`이 바뀌어도 `UserBadge`는 다시 렌더링되지 않는다',
          why: '`theme`이 `value`에 들어 있으므로 `theme`이 바뀌면 `useMemo`도 새 객체를 만듭니다. `user`만 읽는 컴포넌트까지 렌더링되는 것을 막으려면 Context를 나눠야 합니다.',
        },
        {
          text: '`UserBadge`에서 `const { user }`처럼 필요한 필드만 꺼내면 `user`가 바뀔 때만 렌더링된다',
          why: '구조 분해는 받은 값에서 필드를 꺼낼 뿐입니다. Context는 값 전체를 한 덩어리로 다뤄 일부 필드만 구독하는 방법이 없습니다.',
        },
        {
          text: '`useContext` 대신 `AppContext.Consumer`로 읽으면 `user`가 바뀔 때만 렌더링된다',
          why: '`Consumer`도 `useContext`와 똑같이 `value` 전체를 구독하므로, `value` 객체가 바뀌면 다시 렌더링됩니다.',
        },
      ],
      explanation: `Context에는 일부 값만 골라 구독하는 기능(셀렉터)이 없습니다. Provider의 \`value\`가 \`Object.is\` 비교로 달라지면 그 Context를 읽는 **모든 컴포넌트**가 다시 렌더링되는데, 위 코드는 렌더링마다 객체 리터럴로 새 \`value\`를 만듭니다.

개선 방법은 다음과 같습니다.

1. 바뀌는 빈도가 다른 값은 Context를 나눕니다. (\`UserContext\`, \`ThemeContext\`)
2. \`value\`를 \`useMemo\`로 고정하고, setter처럼 바뀌지 않는 값은 별도 Context로 분리합니다.
3. 자주 바뀌는 전역 상태는 셀렉터로 필요한 값만 구독하는 Zustand 같은 외부 스토어를 검토합니다.`,
      tags: [
        'context',
        'rendering',
        'performance',
      ],
    },
    {
      id: 'cs-react-q17',
      categoryId: 'react',
      lessonId: 'cs-react-l04',
      type: 'ox',
      difficulty: 2,
      prompt: '부모가 `useCallback`으로 함수 참조를 고정해 자식에게 넘기더라도, 자식이 `memo`로 감싸져 있지 않다면 부모가 다시 렌더링될 때 자식도 함께 다시 렌더링된다.',
      answer: true,
      explanation: `O. 자식 렌더링을 건너뛰게 하는 것은 \`memo\`의 props 비교입니다. \`memo\`가 없으면 React는 props가 같은지 확인하지 않고 부모를 따라 자식을 렌더링하므로, 함수 참조를 아무리 고정해도 렌더링 횟수는 줄지 않습니다.

\`useCallback\`이 의미 있는 경우는 다음 두 가지입니다.

- \`memo\`로 감싼 자식에게 넘겨, 얕은 비교가 성공하게 할 때
- \`useEffect\` 같은 Hook의 의존성으로 쓰여, 렌더링마다 effect가 다시 실행되지 않게 할 때

그 밖의 경우에는 의존성 비교 비용만 더합니다. 참고로 \`useCallback(fn, deps)\`는 \`useMemo(() => fn, deps)\`와 같은 일을 합니다.`,
      tags: [
        'useCallback',
        'memo',
        'performance',
      ],
    },
    {
      id: 'cs-react-q14',
      categoryId: 'react',
      lessonId: 'cs-react-l05',
      type: 'mcq',
      difficulty: 3,
      prompt: '이 코드에 대한 설명으로 옳은 것은? (React 18+)',
      code: {
        language: 'tsx',
        source: `function SearchPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    startTransition(() => {
      setFilter(e.target.value);
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending && <Spinner />}
      {/* HeavyResultList 는 memo 로 감싼 무거운 목록 */}
      <HeavyResultList filter={filter} />
    </>
  );
}`,
      },
      correct: '`filter` 업데이트를 긴급하지 않은 전환으로 표시해, 그 렌더링 도중 새 입력이 오면 React가 중단하고 입력을 먼저 처리할 수 있다',
      distractors: [
        {
          text: '`startTransition` 안의 업데이트는 웹 워커에서 실행되어 메인 스레드를 차단하지 않는다',
          why: '전환 렌더링도 메인 스레드에서 실행됩니다. React가 작업을 잘게 나눠 중간중간 브라우저에 차례를 양보할 뿐입니다.',
        },
        {
          text: '`startTransition`은 업데이트를 정해진 시간만큼 늦춰서 실행하는 디바운스다',
          why: '정해진 시간을 기다리지 않고, 브라우저에 여유가 있으면 곧바로 렌더링합니다. 네트워크 요청 횟수를 줄이려면 디바운스를 따로 걸어야 합니다.',
        },
        {
          text: '입력값 `query`도 `startTransition` 안에서 업데이트해야 입력이 더 부드러워진다',
          why: '제어 컴포넌트의 입력값을 전환으로 업데이트하면 입력이 오히려 늦게 반영됩니다. 입력값은 긴급 업데이트로 전환 밖에서 바꿔야 합니다.',
        },
        {
          text: '`startTransition`으로 감싸면 `HeavyResultList`의 렌더링 계산 자체가 빨라진다',
          why: '렌더링 작업의 양은 그대로이고 우선순위만 낮아집니다. 계산에 드는 시간은 같지만 그사이 입력 같은 긴급한 업데이트를 먼저 처리할 수 있게 됩니다.',
        },
        {
          text: '전환 렌더링 중에 새 입력이 오면, 진행 중인 렌더링을 끝까지 마친 뒤에 입력을 처리한다',
          why: '전환 렌더링은 중단할 수 있습니다. 새 입력이 오면 진행 중이던 렌더링을 버리고 입력을 먼저 반영한 뒤 최신 값으로 다시 시작합니다.',
        },
        {
          text: '전환이 긴급 렌더링에서 목록을 자동으로 건너뛰게 하므로 `HeavyResultList`의 `memo`는 필요 없다',
          why: '`query`가 바뀌는 긴급 렌더링에서도 `SearchPage`가 다시 렌더링되므로, `memo`가 없으면 `filter`가 그대로인 목록까지 함께 렌더링됩니다.',
        },
      ],
      explanation: `\`startTransition\` 안의 업데이트는 **긴급하지 않은 전환(transition)**으로 표시됩니다. React는 입력값 \`query\` 같은 긴급한 업데이트를 먼저 화면에 반영하고, \`filter\`로 인한 무거운 렌더링은 중간중간 브라우저에 제어권을 돌려주며 진행합니다. 그 사이 새 입력이 들어오면 진행 중이던 렌더링을 **버리고** 최신 값으로 다시 시작하므로 타이핑이 끊기지 않습니다. 전환이 끝나기 전까지 \`isPending\`은 \`true\`입니다.

> \`HeavyResultList\`를 \`memo\`로 감싼 이유는, \`query\`가 바뀌는 긴급 렌더링에서 \`filter\`가 그대로인 목록을 건너뛰기 위해서입니다. 값을 props로 받는 쪽에서는 \`useDeferredValue\`로 같은 효과를 낼 수 있습니다.`,
      tags: [
        'concurrent',
        'useTransition',
      ],
    },
    {
      id: 'cs-react-q15',
      categoryId: 'react',
      lessonId: 'cs-react-l05',
      type: 'mcq',
      difficulty: 3,
      prompt: 'Next.js App Router 코드입니다. 옳은 설명은?',
      code: {
        language: 'tsx',
        source: `// app/products/page.tsx
import { db } from '@/lib/db';
import AddToCartButton from './AddToCartButton';

export default async function ProductsPage() {
  const products = await db.product.findMany();
  return (
    <ul>
      {products.map((p) => (
        <li key={p.id}>
          {p.name} <AddToCartButton productId={p.id} />
        </li>
      ))}
    </ul>
  );
}

// app/products/AddToCartButton.tsx
'use client';
import { useState } from 'react';

export default function AddToCartButton({ productId }: { productId: string }) {
  const [added, setAdded] = useState(false);
  return <button onClick={() => setAdded(true)}>{added ? '담김' : '담기'}</button>;
}`,
      },
      correct: '`ProductsPage`의 코드와 `db` 모듈은 클라이언트 번들에 포함되지 않고, 클라이언트 컴포넌트인 `AddToCartButton`만 번들에 포함되어 하이드레이션된다',
      distractors: [
        {
          text: '`ProductsPage`에서도 `useState`와 `onClick`을 그대로 쓸 수 있고, 이벤트는 서버에서 처리된다',
          why: '서버 컴포넌트는 브라우저에서 실행되지 않으므로 state, effect, 이벤트 핸들러를 쓸 수 없습니다. 상호작용이 필요한 부분만 `\'use client\'` 파일로 분리합니다.',
        },
        {
          text: '`AddToCartButton`은 `use client` 파일이므로 서버에서는 전혀 렌더링되지 않고 브라우저에서만 렌더링된다',
          why: '클라이언트 컴포넌트도 첫 요청 때는 서버에서 HTML로 미리 렌더링(SSR)되고, 브라우저에서 하이드레이션되어 상호작용이 붙습니다.',
        },
        {
          text: '`use client` 파일에서 서버 컴포넌트를 `import`해 렌더링해도 그 컴포넌트는 계속 서버에서만 실행된다',
          why: '`\'use client\'`는 모듈 경계라서 그 파일이 import하는 모듈도 클라이언트 번들에 들어갑니다. 서버 컴포넌트를 안에 두려면 import하지 말고 `children` 같은 props로 받아야 합니다.',
        },
        {
          text: '`ProductsPage`는 `async` 함수라서 브라우저에서 데이터를 받아온 뒤 렌더링된다',
          why: '`async` 서버 컴포넌트는 서버에서 DB를 직접 조회해 렌더링합니다. 브라우저에는 그 결과만 전달되고 `db.product.findMany()`는 브라우저에서 실행되지 않습니다.',
        },
        {
          text: '`AddToCartButton`에 `onAdd={() => addToCart(p.id)}` 같은 일반 함수 prop도 넘길 수 있다',
          why: '서버 컴포넌트에서 클라이언트 컴포넌트로 넘기는 props는 네트워크로 전달되므로 직렬화할 수 있어야 합니다. 일반 함수는 넘길 수 없고 `\'use server\'`로 표시한 Server Function만 예외입니다.',
        },
        {
          text: '서버 컴포넌트도 하이드레이션 대상이라 `ProductsPage`의 코드가 브라우저에서 한 번 더 실행된다',
          why: '서버 컴포넌트의 코드는 브라우저에 아예 내려가지 않고 하이드레이션 대상에서도 빠집니다. 모든 컴포넌트의 JS를 내려보내 하이드레이션하는 것은 서버 컴포넌트 없는 SSR의 방식입니다.',
        },
      ],
      explanation: `App Router에서 컴포넌트는 기본적으로 **서버 컴포넌트**입니다. 서버에서만 실행되어 \`async\`로 DB를 직접 조회할 수 있고, 그 코드는 JS 번들에 들어가지 않습니다. 브라우저에는 렌더링 결과(RSC 페이로드와 HTML)만 전달됩니다.

반면 \`'use client'\`로 표시한 \`AddToCartButton\`은 클라이언트 번들에 포함됩니다. 첫 요청 때는 서버에서 HTML로 미리 렌더링되고, 브라우저에서 하이드레이션되어 클릭 같은 상호작용이 붙습니다. 그래서 데이터를 읽어 그리는 부분은 서버 컴포넌트로 두고, 상호작용이 필요한 작은 조각에만 \`'use client'\`를 붙이는 구성이 기본입니다.

> 서버 컴포넌트에서 클라이언트 컴포넌트로 넘기는 props는 **직렬화할 수 있는 값**이어야 합니다. 일반 함수는 넘길 수 없고, Server Function(\`'use server'\`)만 예외입니다.`,
      tags: [
        'server-components',
        'nextjs',
        'use-client',
      ],
    },
    {
      id: 'cs-react-q18',
      categoryId: 'react',
      lessonId: 'cs-react-l05',
      type: 'ox',
      difficulty: 2,
      prompt: '아래 `OrderList`를 `<Suspense fallback={<Spinner />}>`로 감싸면, 주문 데이터를 불러오는 동안 `Spinner`가 표시된다.',
      code: {
        language: 'tsx',
        source: `function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then(setOrders);
  }, []);

  return (
    <ul>
      {orders.map((o) => (
        <li key={o.id}>{o.title}</li>
      ))}
    </ul>
  );
}`,
      },
      answer: false,
      explanation: `X. Suspense 폴백은 하위 컴포넌트가 렌더링 도중 **일시 중단(suspend)**할 때만 보입니다. 이 컴포넌트는 빈 배열로 렌더링을 바로 마치고, 커밋 뒤 effect에서 데이터를 가져와 state를 바꿉니다. 렌더링이 중단된 적이 없으므로 \`Spinner\`는 나오지 않고 빈 목록이 먼저 보입니다.

일시 중단을 일으키는 것은 다음과 같습니다.

- \`React.lazy\`로 불러오는 컴포넌트
- Suspense를 지원하는 데이터 소스: TanStack Query의 \`useSuspenseQuery\`, React 19의 \`use\`로 읽는 Promise, Next.js 같은 프레임워크의 데이터 로딩

이 컴포넌트에 로딩 표시가 필요하면 로딩 state를 직접 두거나, 위 방식 중 하나로 바꿔 Suspense 경계를 활용합니다. 실패는 에러 바운더리로 함께 처리합니다.`,
      tags: [
        'suspense',
        'data-fetching',
      ],
    },
  ],
  cards: [
    {
      id: 'cs-react-c01',
      categoryId: 'react',
      difficulty: 1,
      question: '가상 DOM(Virtual DOM)이란 무엇이고, React는 어떤 과정으로 화면을 업데이트하나요?',
      answer: `가상 DOM은 화면을 어떻게 그릴지 표현한 **자바스크립트 객체 트리**(React 엘리먼트)입니다. state가 바뀌면 React는 컴포넌트를 다시 실행해 새 트리를 만들고, 이전 트리와 비교하는 **재조정(Reconciliation)**으로 바뀐 부분을 찾아 실제 DOM에는 그 차이만 반영합니다. 이 과정은 트리를 계산하는 **렌더 단계**와 DOM에 적용하는 **커밋 단계**로 나뉩니다.

트리 비교는 O(n)에 끝나도록 휴리스틱을 씁니다.

- 엘리먼트 타입이 다르면(\`div\` → \`span\`, \`A\` → \`B\`) 하위 트리를 통째로 버리고 새로 만듭니다. 이때 하위 컴포넌트의 state도 사라집니다.
- 타입이 같으면 DOM 노드를 유지하고 바뀐 속성만 갱신합니다.
- 목록은 **key**로 같은 항목을 식별하므로, key는 데이터의 고유 id처럼 안정적인 값이어야 합니다.

가상 DOM이 직접 DOM 조작보다 항상 빠른 것은 아닙니다. 핵심 가치는 UI를 **선언적으로 작성해도** React가 변경을 모아 필요한 만큼만 DOM을 건드려 충분한 성능을 낸다는 데 있습니다.`,
      keywords: [
        'React 엘리먼트 트리',
        '재조정(Reconciliation)',
        '렌더 단계 · 커밋 단계',
        '타입 비교 휴리스틱',
        'key',
      ],
      followUps: [
        {
          question: '리스트에서 key로 인덱스를 쓰면 어떤 문제가 생기나요?',
          answer: '항목이 삽입 · 삭제 · 재정렬되면 같은 인덱스에 다른 데이터가 오는데, React는 key가 같으니 같은 항목으로 보고 그 자리의 DOM과 컴포넌트 state를 그대로 재사용합니다. 그래서 비제어 입력값, 체크 상태, 포커스 같은 것이 엉뚱한 항목 옆에 남습니다. 맨 앞에 항목 하나를 끼워 넣으면 뒤쪽 항목이 모두 다른 데이터를 받아 전부 갱신되므로 성능에도 손해입니다. 그래서 인덱스 key는 순서가 바뀌지 않는 정적인 목록에서만 안전합니다.',
          followUps: [
            {
              question: '데이터에 고유 id가 없으면 key를 어떻게 정하나요?',
              answer: '데이터를 만들거나 받아 오는 시점에 `crypto.randomUUID()` 같은 값으로 id를 한 번 붙여 두고, 이후에는 그 값을 key로 씁니다. 렌더링할 때마다 새로 만들면 key가 매번 바뀌어 모든 항목이 다시 마운트되므로 안 됩니다. 항목 안에 서로 겹치지 않는 필드 조합이 있다면 그것을 key로 써도 됩니다.',
            },
          ],
        },
        {
          question: '가상 DOM을 쓰면 항상 직접 DOM을 조작하는 것보다 빠른가요?',
          answer: '아닙니다. 가상 DOM은 업데이트마다 새 엘리먼트 트리를 만들고 이전 트리와 비교하는 비용이 추가로 들기 때문에, 바뀔 곳을 정확히 알고 손으로 짠 DOM 조작보다 빠를 수는 없습니다. 대신 무엇이 바뀌었는지 개발자가 일일이 추적하지 않고 화면 전체를 선언적으로 써도, 실제 DOM 변경을 필요한 만큼으로 줄여 대부분의 화면에서 충분한 성능을 냅니다. 즉 가상 DOM의 가치는 최고 속도가 아니라 유지보수하기 쉬운 코드와 예측 가능한 성능 사이의 균형에 있습니다.',
        },
        {
          question: 'React Fiber 아키텍처는 무엇을 가능하게 했나요?',
          answer: 'React 16에서 도입된 Fiber는 재조정 엔진을 다시 작성한 것으로, 컴포넌트 하나하나를 작업 단위(fiber 노드)로 쪼개 렌더 작업을 **멈췄다가 이어 가거나, 우선순위를 바꾸거나, 버릴 수** 있게 했습니다. 이전의 스택 재조정은 재귀 호출로 트리 전체를 한 번에 처리해서 중간에 끊을 수 없었습니다. 이 구조 위에서 React 18의 동시성 렌더링과 Suspense가 가능해졌습니다. 다만 DOM에 반영하는 커밋 단계는 화면이 어긋나지 않도록 지금도 한 번에 동기적으로 실행됩니다.',
          followUps: [
            {
              question: '렌더 단계가 중단 · 재시작될 수 있다면, 렌더링 중에 부수 효과를 넣으면 어떻게 되나요?',
              answer: '컴포넌트 함수가 여러 번 호출되거나 그 결과가 버려질 수 있으므로, 그 안의 API 호출이나 전역 변수 수정이 예상보다 여러 번, 또는 화면에 반영되지 않은 렌더링에서도 실행됩니다. 그래서 렌더링은 순수해야 하고 부수 효과는 이벤트 핸들러나 effect에 둡니다. 개발 모드의 StrictMode가 컴포넌트 함수를 일부러 두 번 호출하는 것도 이런 순수하지 않은 코드를 드러내기 위해서입니다.',
            },
          ],
        },
      ],
    },
  ],
};

export default content;
