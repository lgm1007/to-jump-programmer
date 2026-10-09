import { MANAGER_JS } from './manager-js';
import { PYODIDE_BASE_URL, WORKER_JS } from './worker-js';

/** JSON 을 <script> 안에 안전하게 넣기 위한 이스케이프 */
function scriptSafe(json: string): string {
  return json.replace(/<\//g, '<\\/').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

/** 네이티브용 숨김 WebView 페이지 */
export const RUNNER_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
<script>
(function () {
${MANAGER_JS}
  var send = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  var mgr = createManager(send, ${scriptSafe(JSON.stringify(WORKER_JS))}, ${scriptSafe(JSON.stringify(PYODIDE_BASE_URL))});
  window.__tjReceive = function (m) {
    try { mgr.handle(m); } catch (e) { send({ type: "host-error", message: String(e && e.message || e) }); }
  };
  send({ type: "ready" });
})();
</script>
</body>
</html>`;
