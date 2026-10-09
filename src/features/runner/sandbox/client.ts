/**
 * 앱 ↔ 샌드박스(WebView/Worker) 메시지 클라이언트.
 * RunnerHost 컴포넌트가 transport 를 연결(attach)한다.
 */
import type { SolveLanguage } from '@/content/types';

export type SandboxEvent =
  | { type: 'ready' }
  | { type: 'warm'; language: string }
  | { type: 'cold'; language: string }
  | { type: 'host-error'; message: string }
  | { type: 'status'; id: string; message: string }
  | { type: 'started'; id: string }
  | { type: 'case'; id: string; index: number; ok: boolean; value: unknown; stdout: string; timeMs: number }
  | { type: 'timeout'; id: string; index: number }
  | { type: 'compile-error'; id: string; message: string; stdout?: string }
  | { type: 'done'; id: string };

type Transport = (msg: object) => void;
type Handler = (e: SandboxEvent) => void;

/** 실행을 요청한 뒤 이 시간 안에 아무 응답이 없으면 실행 환경이 죽은 것으로 본다 */
const WATCHDOG_MS = 15_000;

let seq = 0;

class SandboxClient {
  private transport: Transport | null = null;
  private pending: { id?: string; msg: object }[] = [];
  private handlers = new Map<string, Handler>();
  private warmed = new Set<string>();
  private warmListeners = new Set<() => void>();
  private restartListeners = new Set<() => void>();

  attach(transport: Transport) {
    this.transport = transport;
    const queued = this.pending;
    this.pending = [];
    queued.forEach((p) => transport(p.msg));
  }

  /** 실행 환경이 사라졌을 때 (WebView 재시작 등) 진행 중 작업을 실패 처리 */
  detach(reason = '실행 환경이 재시작되었습니다. 다시 실행해주세요.') {
    this.transport = null;
    this.pending = [];
    if (this.warmed.size) {
      this.warmed.clear();
      this.warmListeners.forEach((l) => l());
    }
    for (const [id, handler] of [...this.handlers]) {
      handler({ type: 'compile-error', id, message: reason });
      handler({ type: 'done', id });
    }
  }

  private send(msg: object, id?: string) {
    if (this.transport) this.transport(msg);
    else this.pending.push({ id, msg });
  }

  receive(e: SandboxEvent) {
    if (e.type === 'warm' || e.type === 'cold') {
      const changed = e.type === 'warm' ? !this.warmed.has(e.language) : this.warmed.has(e.language);
      if (e.type === 'warm') this.warmed.add(e.language);
      else this.warmed.delete(e.language);
      if (changed) this.warmListeners.forEach((l) => l());
      return;
    }
    if ('id' in e) this.handlers.get(e.id)?.(e);
  }

  isWarm(language: SolveLanguage): boolean {
    return language === 'javascript' || this.warmed.has(language);
  }

  onWarmChange(listener: () => void): () => void {
    this.warmListeners.add(listener);
    return () => this.warmListeners.delete(listener);
  }

  /** 실행 환경이 응답하지 않을 때 호스트(WebView)를 다시 만들도록 요청받는다 */
  onRestartRequest(listener: () => void): () => void {
    this.restartListeners.add(listener);
    return () => this.restartListeners.delete(listener);
  }

  /** Python 런타임을 미리 내려받아 첫 실행을 빠르게 */
  warmup(language: SolveLanguage) {
    if (language === 'python' && !this.warmed.has('python')) this.send({ type: 'warmup', language });
  }

  run(
    params: { language: SolveLanguage; code: string; tests: unknown[][]; timeLimitMs: number },
    onEvent: Handler,
  ): { done: Promise<void>; cancel: () => void } {
    const id = `run-${Date.now()}-${++seq}`;
    let resolveDone!: () => void;
    const done = new Promise<void>((r) => (resolveDone = r));

    let watchdog: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      watchdog = null;
      const handler = this.handlers.get(id);
      if (!handler) return;
      this.pending = this.pending.filter((p) => p.id !== id);
      handler({ type: 'compile-error', id, message: '실행 환경이 응답하지 않아 다시 시작했어요. 잠시 후 다시 실행해주세요.' });
      handler({ type: 'done', id });
      this.restartListeners.forEach((l) => l());
    }, WATCHDOG_MS);

    this.handlers.set(id, (e) => {
      if (watchdog) {
        clearTimeout(watchdog);
        watchdog = null;
      }
      if (e.type === 'started' && params.language === 'python' && !this.warmed.has('python')) {
        this.warmed.add('python');
        this.warmListeners.forEach((l) => l());
      }
      onEvent(e);
      if (e.type === 'done') {
        this.handlers.delete(id);
        resolveDone();
      }
    });
    this.send({ type: 'run', id, ...params }, id);
    return {
      done,
      cancel: () => {
        if (this.handlers.has(id)) this.send({ type: 'cancel', id });
      },
    };
  }
}

export const sandbox = new SandboxClient();
