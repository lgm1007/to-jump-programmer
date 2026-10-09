"""검증 스크립트용 Python 모범 답안 실행기.

stdin 으로 {"code": str, "tests": [[args...], ...], "timeLimitSec": float} 를 받아
stdout 으로 {"results": [...]} 또는 {"compileError": str} 를 출력한다.
"""
import contextlib
import copy
import io
import json
import signal
import sys
import time
import traceback


def main() -> None:
    payload = json.load(sys.stdin)
    code = payload["code"]
    tests = payload["tests"]
    time_limit = float(payload.get("timeLimitSec", 10))

    ns: dict = {"__name__": "__solution__"}
    try:
        exec(compile(code, "<solution>", "exec"), ns)
    except BaseException:  # noqa: BLE001
        print(json.dumps({"compileError": traceback.format_exc()}))
        return

    fn = ns.get("solution")
    if not callable(fn):
        print(json.dumps({"compileError": "solution 함수가 없습니다."}))
        return

    def on_timeout(signum, frame):  # noqa: ARG001
        raise TimeoutError("time limit exceeded")

    signal.signal(signal.SIGALRM, on_timeout)
    results = []
    for i, args in enumerate(tests):
        buf = io.StringIO()
        start = time.perf_counter()
        try:
            signal.setitimer(signal.ITIMER_REAL, time_limit)
            with contextlib.redirect_stdout(buf):
                value = fn(*copy.deepcopy(args))
            signal.setitimer(signal.ITIMER_REAL, 0)
            value = json.loads(json.dumps(value, default=list))
            results.append({"index": i, "ok": True, "value": value, "stdout": buf.getvalue(),
                            "ms": (time.perf_counter() - start) * 1000})
        except BaseException as e:  # noqa: BLE001
            signal.setitimer(signal.ITIMER_REAL, 0)
            results.append({"index": i, "ok": False, "value": f"{type(e).__name__}: {e}",
                            "stdout": buf.getvalue(), "ms": (time.perf_counter() - start) * 1000})
    print(json.dumps({"results": results}, ensure_ascii=False))


if __name__ == "__main__":
    main()
