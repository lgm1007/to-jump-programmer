import { useEffect, useState } from 'react';

import { sandbox, type SandboxEvent } from './sandbox/client';
import { MANAGER_JS } from './sandbox/manager-js';
import { PYODIDE_BASE_URL, WORKER_JS } from './sandbox/worker-js';

type Manager = { handle: (m: object) => void };
type CreateManager = (post: (m: SandboxEvent) => void, workerSource: string, pyodideUrl: string) => Manager;

/** 웹: 브라우저에서 직접 Worker 를 관리한다 (네이티브의 WebView 매니저와 같은 코드). */
export function RunnerHost() {
  const [generation, setGeneration] = useState(0);

  useEffect(
    () =>
      sandbox.onRestartRequest(() => {
        sandbox.detach();
        setGeneration((g) => g + 1);
      }),
    [],
  );

  useEffect(() => {
    const createManager = new Function(`${MANAGER_JS}\nreturn createManager;`)() as CreateManager;
    let active = true;
    const manager = createManager((m) => active && sandbox.receive(m), WORKER_JS, PYODIDE_BASE_URL);
    sandbox.attach((m) => manager.handle(m));
    return () => {
      active = false;
      sandbox.detach();
    };
  }, [generation]);
  return null;
}
