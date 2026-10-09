/**
 * 샌드박스 Web Worker 코드 (문자열, ES 모듈 Worker).
 * 네이티브에서는 숨겨진 WebView 안에서, 웹에서는 브라우저에서 Blob 모듈 Worker 로 실행된다.
 * Hermes 릴리스 빌드에서는 Function.toString() 으로 소스를 얻을 수 없으므로 문자열로 유지한다.
 * (주의: 이 문자열 안에서는 백틱과 달러-중괄호를 쓰지 않는다)
 *
 * 이벤트 순서: [status] → loaded(사용자 최상위 코드 실행 직전) → started(케이스 실행 직전) → case* → done
 *              실패 시 compile-error, 런타임 붕괴 시 fatal(+message) → 매니저가 Worker 를 교체하고 done 을 보장
 */
export const PYODIDE_VERSION = '314.0.7';
export const PYODIDE_BASE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

export const WORKER_JS = String.raw`
"use strict";
var PYODIDE_URL = self.__TJ_PYODIDE_URL__;
var pyodide = null;
var pyLoading = null;

function post(msg) { self.postMessage(msg); }

/* ---------- 콘솔 출력 포맷 (브라우저 콘솔과 비슷하게) ---------- */

function isTypedArray(v) {
  return ArrayBuffer.isView(v) && !(v instanceof DataView);
}

function fmt(v, stack) {
  if (v === null) return "null";
  var t = typeof v;
  if (t === "string") return stack.length ? JSON.stringify(v) : v;
  if (t === "number" || t === "boolean" || t === "undefined" || t === "symbol") return String(v);
  if (t === "bigint") return String(v) + "n";
  if (t === "function") return "[Function " + (v.name || "anonymous") + "]";
  // 순환 참조는 '조상'만 추적한다 (같은 객체를 두 번 참조하는 것은 순환이 아님)
  if (stack.indexOf(v) >= 0) return "[Circular]";
  if (stack.length >= 6) return Array.isArray(v) ? "[Array]" : "[Object]";
  stack.push(v);
  var s;
  try {
    if (Array.isArray(v) || isTypedArray(v)) {
      var arr = Array.from(v);
      var items = arr.slice(0, 100).map(function (x) { return fmt(x, stack); });
      if (arr.length > 100) items.push("... " + (arr.length - 100) + " more");
      s = "[" + items.join(", ") + "]";
    } else if (v instanceof Map) {
      var entries = Array.from(v.entries()).slice(0, 100).map(function (e) { return fmt(e[0], stack) + " => " + fmt(e[1], stack); });
      s = "Map(" + v.size + ") {" + entries.join(", ") + "}";
    } else if (v instanceof Set) {
      var values = Array.from(v.values()).slice(0, 100).map(function (x) { return fmt(x, stack); });
      s = "Set(" + v.size + ") {" + values.join(", ") + "}";
    } else if (v instanceof Error) {
      s = String(v);
    } else {
      var keys = Object.keys(v);
      s = "{ " + keys.slice(0, 50).map(function (k) { return k + ": " + fmt(v[k], stack); }).join(", ") + (keys.length > 50 ? ", ..." : "") + " }";
      if (!keys.length) s = "{}";
    }
  } catch (e) {
    s = String(v);
  }
  stack.pop();
  return s;
}

/* ---------- JavaScript ---------- */

// new Function 본문의 줄 번호 오프셋을 엔진별로 측정
function errorLine(e) {
  if (!e) return null;
  var m = /<anonymous>:(\d+):(\d+)/.exec(String(e.stack));
  if (m) return Number(m[1]);
  if (typeof e.line === "number") return e.line; // JavaScriptCore (iOS)
  return null;
}
var JS_LINE_OFFSET = (function () {
  try {
    new Function("\n\nthrow new Error('probe')")();
  } catch (e) {
    var line = errorLine(e);
    if (line !== null) return line - 3;
  }
  return null;
})();

function formatJsError(err) {
  if (!err) return "알 수 없는 오류";
  var name = err.name || "Error";
  var msg = name + ": " + (err.message || String(err));
  var raw = errorLine(err);
  if (JS_LINE_OFFSET !== null && raw !== null) {
    var line = raw - JS_LINE_OFFSET;
    if (line > 0) msg += "\n    at " + line + "번째 줄";
  }
  if (err instanceof RangeError && /call stack/i.test(err.message)) {
    msg += "\n재귀 호출이 너무 깊습니다. 종료 조건을 확인하거나 반복문으로 바꿔보세요.";
  }
  return msg;
}

function toJsonValue(v) {
  if (v === undefined) return null;
  return JSON.parse(JSON.stringify(v, function (k, val) {
    if (typeof val === "bigint") return Number(val);
    if (val instanceof Set) return Array.from(val);
    if (val instanceof Map) return Array.from(val.entries());
    if (isTypedArray(val)) return Array.from(val);
    return val;
  }));
}

function runJs(msg) {
  var logs = [];
  var write = function () {
    var parts = [];
    for (var i = 0; i < arguments.length; i++) parts.push(fmt(arguments[i], []));
    logs.push(parts.join(" "));
  };
  var fakeConsole = { log: write, info: write, warn: write, error: write, debug: write, table: write, dir: write };
  var solution;
  post({ type: "loaded", id: msg.id });
  try {
    solution = new Function("console", msg.code + "\n;return (typeof solution === 'function') ? solution : undefined;")(fakeConsole);
  } catch (err) {
    post({ type: "compile-error", id: msg.id, message: formatJsError(err), stdout: logs.join("\n") });
    return;
  }
  if (typeof solution !== "function") {
    post({ type: "compile-error", id: msg.id, message: "solution 함수를 찾을 수 없습니다. function solution(...) { } 형태로 작성해주세요.", stdout: logs.join("\n") });
    return;
  }
  post({ type: "started", id: msg.id });
  for (var i = 0; i < msg.tests.length; i++) {
    logs.length = 0;
    var args = JSON.parse(JSON.stringify(msg.tests[i]));
    var t0 = performance.now();
    try {
      var result = solution.apply(null, args);
      if (result && typeof result.then === "function") {
        throw new Error("solution 함수는 Promise 가 아닌 값을 반환해야 합니다 (async 사용 불가).");
      }
      var value = toJsonValue(result);
      post({ type: "case", id: msg.id, index: i, ok: true, value: value, stdout: logs.join("\n"), timeMs: performance.now() - t0 });
    } catch (err) {
      post({ type: "case", id: msg.id, index: i, ok: false, value: formatJsError(err), stdout: logs.join("\n"), timeMs: performance.now() - t0 });
    }
  }
  post({ type: "done", id: msg.id });
}

/* ---------- Python (Pyodide) ---------- */

var FATAL_HINT =
  "실행 환경이 중단되었습니다. 재귀가 너무 깊으면 WebAssembly 스택이 넘칠 수 있어요.\n" +
  "@lru_cache 같은 깊은 재귀 대신 반복문(바텀업 DP)이나 명시적 스택/큐로 바꿔보세요.";

// Pyodide 가 회복 불가능한 상태(스택 초과 등)가 되었는지
function isFatal(err) {
  if (!err) return false;
  if (err.pyodide_fatal_error) return true;
  return /fatally failed|fatal error/i.test(String(err.message || err));
}

function resetPython() {
  pyodide = null;
  pyLoading = null;
}

function loadPy(id) {
  if (pyodide) return Promise.resolve(pyodide);
  if (!pyLoading) {
    if (id) post({ type: "status", id: id, message: "Python 실행 환경을 불러오는 중이에요 (처음 한 번만 약 10MB 다운로드)" });
    pyLoading = (async function () {
      // Pyodide 0.28+ 는 모듈 Worker 에서만 동작한다 (매니저가 type: "module" 로 생성)
      var mod = await import(PYODIDE_URL + "pyodide.mjs");
      var py = await mod.loadPyodide({ indexURL: PYODIDE_URL });
      py.runPython(
        "import sys, json, traceback\n" +
        "def __tj_format_exc(e):\n" +
        "    lines = []\n" +
        "    for fs in traceback.extract_tb(e.__traceback__):\n" +
        "        if fs.filename == '<solution>':\n" +
        "            lines.append('    at ' + str(fs.lineno) + '번째 줄, ' + fs.name + '()' + ('  ->  ' + fs.line if fs.line else ''))\n" +
        "    head = type(e).__name__ + (': ' + str(e) if str(e) else '')\n" +
        "    if isinstance(e, RecursionError):\n" +
        "        head += '\\n재귀 깊이 제한을 넘었습니다. 반복문(스택/큐)으로 바꿔보세요.'\n" +
        "    return head + ('\\n' + '\\n'.join(lines[-6:]) if lines else '')\n",
        { filename: "<harness>" }
      );
      pyodide = py;
      return py;
    })();
    pyLoading.catch(function () { pyLoading = null; });
  }
  return pyLoading;
}

// 하네스 코드가 쓰는 이름을 사용자 네임스페이스에 주입 (사용자 변수와 겹치지 않게 __tj_ 접두어)
function mergeHarness(py, ns) {
  if (!ns.has("__tj_json")) {
    ns.set("__tj_json", py.globals.get("json"));
    ns.set("__tj_sys", py.globals.get("sys"));
    ns.set("__tj_format_exc", py.globals.get("__tj_format_exc"));
  }
  return ns;
}

var FLUSH_CODE =
  "try:\n" +
  "    __tj_sys.stdout.flush()\n" +
  "    __tj_sys.stderr.flush()\n" +
  "except BaseException:\n" +
  "    pass\n";

var CASE_CODE =
  "__tj_out = None\n" +
  "__tj_err = None\n" +
  "try:\n" +
  "    __tj_res = solution(*__tj_json.loads(__tj_args))\n" +
  "    __tj_out = __tj_json.dumps(__tj_res, default=lambda o: list(o) if hasattr(o, '__iter__') else str(o), ensure_ascii=False)\n" +
  "except BaseException as __tj_e:\n" +
  "    __tj_err = __tj_format_exc(__tj_e)\n" +
  "finally:\n" +
  "    try:\n" +
  "        __tj_sys.stdout.flush()\n" +
  "        __tj_sys.stderr.flush()\n" +
  "    except BaseException:\n" +
  "        pass\n";

function trimOut(s) {
  return s.replace(/\n$/, "");
}

// 치명적 오류 시 Pyodide 가 stderr 로 쏟아내는 내부 스택 덤프는 잘라낸다
function fatalOut(s) {
  var cut = s.search(/Fatal Python error|Stack \(most recent call first\)|Pyodide has suffered a fatal error/);
  return trimOut(cut >= 0 ? s.slice(0, cut) : s);
}

async function runPy(msg) {
  var py;
  try {
    py = await loadPy(msg.id);
  } catch (err) {
    post({ type: "compile-error", id: msg.id, message: "Python 실행 환경을 불러오지 못했습니다. 인터넷 연결을 확인해주세요.\n" + String(err && err.message || err) });
    return;
  }

  // 개행 없이 출력한 내용도 놓치지 않도록 바이트 단위로 받는다 (케이스마다 flush)
  var out = "";
  var decOut = new TextDecoder();
  var decErr = new TextDecoder();
  py.setStdout({ write: function (buf) { out += decOut.decode(buf, { stream: true }); return buf.length; } });
  py.setStderr({ write: function (buf) { out += decErr.decode(buf, { stream: true }); return buf.length; } });

  var ns = py.globals.get("dict")();
  ns.set("__name__", "__main__");
  mergeHarness(py, ns);
  var flush = function () {
    try { py.runPython(FLUSH_CODE, { globals: ns, filename: "<harness>" }); } catch (e) {}
  };

  try {
    post({ type: "loaded", id: msg.id });
    try {
      py.runPython(msg.code, { globals: ns, filename: "<solution>" });
    } catch (err) {
      if (isFatal(err)) {
        resetPython();
        post({ type: "fatal", id: msg.id, message: FATAL_HINT, stdout: fatalOut(out) });
        return;
      }
      flush();
      post({ type: "compile-error", id: msg.id, message: pyErrorMessage(err), stdout: trimOut(out) });
      return;
    }
    flush();
    if (!ns.has("solution")) {
      post({ type: "compile-error", id: msg.id, message: "solution 함수를 찾을 수 없습니다. def solution(...): 형태로 작성해주세요.", stdout: trimOut(out) });
      return;
    }
    post({ type: "started", id: msg.id });
    for (var i = 0; i < msg.tests.length; i++) {
      out = "";
      ns.set("__tj_args", JSON.stringify(msg.tests[i]));
      var t0 = performance.now();
      try {
        py.runPython(CASE_CODE, { globals: ns, filename: "<harness>" });
        var ms = performance.now() - t0;
        var err = ns.get("__tj_err");
        if (err !== undefined && err !== null) {
          post({ type: "case", id: msg.id, index: i, ok: false, value: String(err), stdout: trimOut(out), timeMs: ms });
        } else {
          var raw = ns.get("__tj_out");
          var value = null;
          try { value = JSON.parse(raw); } catch (e) { value = String(raw); }
          post({ type: "case", id: msg.id, index: i, ok: true, value: value, stdout: trimOut(out), timeMs: ms });
        }
      } catch (err2) {
        if (isFatal(err2)) {
          resetPython();
          post({ type: "case", id: msg.id, index: i, ok: false, value: FATAL_HINT, stdout: fatalOut(out), timeMs: performance.now() - t0 });
          post({ type: "fatal", id: msg.id });
          return;
        }
        post({ type: "case", id: msg.id, index: i, ok: false, value: pyErrorMessage(err2), stdout: trimOut(out), timeMs: performance.now() - t0 });
      }
    }
    post({ type: "done", id: msg.id });
  } finally {
    try { ns.destroy(); } catch (e) {}
  }
}

function pyErrorMessage(err) {
  var text = String(err && err.message || err);
  // 트레이스백에서 사용자 코드 부분만 추린다
  var lines = text.split("\n");
  var last = "";
  for (var j = lines.length - 1; j >= 0; j--) {
    if (lines[j].trim()) { last = lines[j].trim(); break; }
  }
  var picked = [];
  for (var i = 0; i < lines.length; i++) {
    var m = /File "<solution>", line (\d+)/.exec(lines[i]);
    if (m) {
      picked.push("    at " + m[1] + "번째 줄");
      var next = lines[i + 1];
      if (next && next.trim() && next.trim() !== last && !/^\s*File /.test(next) && !/^\s*[\^~]+\s*$/.test(next)) {
        picked.push("      " + next.trim());
      }
    }
  }
  return last + (picked.length ? "\n" + picked.slice(-6).join("\n") : "");
}

self.onmessage = function (e) {
  var msg = e.data;
  if (!msg || typeof msg !== "object") return;
  if (msg.type === "warmup") {
    if (msg.language === "python") {
      loadPy(null).then(function () { post({ type: "warm", language: "python" }); }, function () {});
    }
    return;
  }
  if (msg.type === "run") {
    if (msg.language === "javascript") {
      try {
        runJs(msg);
      } catch (err) {
        post({ type: "compile-error", id: msg.id, message: "실행 중 오류가 발생했습니다: " + String(err && err.message || err) });
      }
    } else if (msg.language === "python") {
      runPy(msg).catch(function (err) {
        // 어떤 경우에도 매니저가 실행을 끝낼 수 있도록 마지막 이벤트를 보낸다
        if (isFatal(err)) {
          resetPython();
          post({ type: "fatal", id: msg.id, message: FATAL_HINT });
        } else {
          post({ type: "compile-error", id: msg.id, message: "실행 중 오류가 발생했습니다: " + String(err && err.message || err) });
        }
      });
    }
  }
};
`;
