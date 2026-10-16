/** The small slice of the Desmos API this app uses. */
export interface DesmosCalculator {
  getState(): unknown;
  setState(state: unknown): void;
  resize(): void;
  observeEvent(event: 'change', cb: () => void): void;
  destroy(): void;
}

export interface DesmosApi {
  GraphingCalculator(el: HTMLElement, opts?: Record<string, unknown>): DesmosCalculator;
  ScientificCalculator(el: HTMLElement, opts?: Record<string, unknown>): DesmosCalculator;
}

declare global {
  interface Window {
    Desmos?: DesmosApi;
  }
}

const API_VERSION = 'v1.11';
/** Desmos's public demo key from their API docs: for local development only. */
const DEMO_KEY = 'dcb31709b452b1cf9dc26972add0fda6';

export function desmosKey(): string | undefined {
  const key = import.meta.env.VITE_DESMOS_API_KEY?.trim();
  if (key) return key;
  return import.meta.env.DEV ? DEMO_KEY : undefined;
}

let promise: Promise<DesmosApi> | undefined;

export function loadDesmos(): Promise<DesmosApi> {
  if (window.Desmos) return Promise.resolve(window.Desmos);
  const key = desmosKey();
  if (!key) return Promise.reject(new Error('missing-key'));
  promise ??= new Promise<DesmosApi>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.desmos.com/api/${API_VERSION}/calculator.js?apiKey=${encodeURIComponent(key)}`;
    s.async = true;
    s.onload = () => (window.Desmos ? resolve(window.Desmos) : reject(new Error('load-failed')));
    s.onerror = () => {
      s.remove();
      promise = undefined; // allow a retry
      reject(new Error('load-failed'));
    };
    document.head.appendChild(s);
  });
  return promise;
}
