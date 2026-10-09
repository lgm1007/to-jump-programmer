/**
 * 샌드박스 매니저 코드 (문자열). 언어별 Worker 를 관리하고, 제한 시간을 넘기면
 * Worker 를 강제 종료(terminate)해 무한 루프에서도 앱이 멈추지 않게 한다.
 *
 *   createManager(post, workerSource, pyodideUrl) → { handle(msg) }
 *
 * 실행 단계별 제한 시간
 *   load     : 실행 환경 준비 (Pyodide 다운로드 등)          → LOAD_TIMEOUT_MS
 *   toplevel : solution 밖의 사용자 최상위 코드 실행          → timeLimitMs
 *   cases    : 케이스 하나당                                 → timeLimitMs
 * 모든 run 은 정확히 한 번의 done 으로 끝난다.
 *
 * (주의: 이 문자열 안에서는 백틱과 달러-중괄호를 쓰지 않는다)
 */
export const MANAGER_JS = String.raw`
function createManager(post, workerSource, pyodideUrl) {
  var workers = {};
  var current = null;
  var queue = [];
  var LOAD_TIMEOUT_MS = 120000;

  function spawn(language) {
    var src = "self.__TJ_PYODIDE_URL__ = " + JSON.stringify(pyodideUrl) + ";\n" + workerSource;
    var url = URL.createObjectURL(new Blob([src], { type: "application/javascript" }));
    var w = new Worker(url, { type: "module" });
    w.onmessage = function (e) { onWorkerMessage(language, e.data); };
    w.onerror = function (e) {
      if (e && e.preventDefault) e.preventDefault();
      onWorkerError(language, e);
    };
    workers[language] = w;
    return w;
  }

  function getWorker(language) {
    return workers[language] || spawn(language);
  }

  function kill(language) {
    var w = workers[language];
    if (w) {
      try { w.terminate(); } catch (e) {}
      delete workers[language];
      // 런타임이 사라졌음을 알린다 (Python 은 다음 실행 때 다시 내려받아 준비)
      post({ type: "cold", language: language });
    }
  }

  function clearTimer() {
    if (current && current.timer) {
      clearTimeout(current.timer);
      current.timer = null;
    }
  }

  function arm(ms, phase) {
    clearTimer();
    current.phase = phase;
    current.timer = setTimeout(onTimeout, ms);
  }

  function finish() {
    clearTimer();
    current = null;
    pump();
  }

  function onTimeout() {
    if (!current) return;
    var c = current;
    kill(c.language);
    if (c.phase === "load") {
      post({ type: "compile-error", id: c.id, message: "실행 환경을 준비하는 데 너무 오래 걸립니다. 네트워크 상태를 확인하고 다시 시도해주세요." });
    } else if (c.phase === "toplevel") {
      post({ type: "compile-error", id: c.id, message: "solution 함수 밖에서 실행되는 코드가 제한 시간(" + (c.timeLimitMs / 1000) + "초)을 넘겼습니다.\n테스트용 호출(print(solution(...)) 등)이나 무한 루프가 남아 있지 않은지 확인해주세요." });
    } else {
      post({ type: "timeout", id: c.id, index: c.next });
    }
    post({ type: "done", id: c.id });
    finish();
  }

  function pump() {
    if (current || queue.length === 0) return;
    var msg = queue.shift();
    current = { id: msg.id, language: msg.language, next: 0, timeLimitMs: msg.timeLimitMs || 5000, timer: null, phase: "load" };
    arm(LOAD_TIMEOUT_MS, "load");
    try {
      getWorker(msg.language).postMessage(msg);
    } catch (e) {
      post({ type: "compile-error", id: msg.id, message: "실행 환경을 시작하지 못했습니다: " + String(e && e.message || e) });
      post({ type: "done", id: msg.id });
      finish();
    }
  }

  function onWorkerMessage(language, m) {
    if (!m || typeof m !== "object") return;
    if (m.type === "warm") { post(m); return; }
    if (!current || m.id !== current.id) return;
    switch (m.type) {
      case "status":
        post(m);
        break;
      case "loaded":
        arm(current.timeLimitMs, "toplevel");
        break;
      case "started":
        arm(current.timeLimitMs, "cases");
        post(m);
        break;
      case "case":
        current.next = m.index + 1;
        arm(current.timeLimitMs, "cases");
        post(m);
        break;
      case "compile-error":
        post(m);
        post({ type: "done", id: m.id });
        finish();
        break;
      case "fatal":
        // 회복 불가능한 런타임 → Worker 를 교체한다
        kill(language);
        if (m.message) post({ type: "compile-error", id: m.id, message: m.message, stdout: m.stdout });
        post({ type: "done", id: m.id });
        finish();
        break;
      case "done":
        post(m);
        finish();
        break;
    }
  }

  function onWorkerError(language, e) {
    kill(language);
    if (current && current.language === language) {
      var id = current.id;
      post({ type: "compile-error", id: id, message: "실행 중 오류가 발생했습니다: " + String(e && e.message || "") });
      post({ type: "done", id: id });
      finish();
    }
  }

  function handle(msg) {
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "run") {
      queue.push(msg);
      pump();
    } else if (msg.type === "warmup") {
      try { getWorker(msg.language).postMessage(msg); } catch (e) {}
    } else if (msg.type === "cancel") {
      if (current && current.id === msg.id) {
        kill(current.language);
        post({ type: "done", id: msg.id });
        finish();
      } else {
        var before = queue.length;
        queue = queue.filter(function (q) { return q.id !== msg.id; });
        if (queue.length !== before) post({ type: "done", id: msg.id });
      }
    }
  }

  return { handle: handle };
}
`;
