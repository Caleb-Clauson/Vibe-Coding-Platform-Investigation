import { JSDOM } from 'jsdom';

// Load before React DOM so the context tests exercise a browser-like environment.
export const testDom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost',
});

for (const [key, value] of Object.entries({
  window: testDom.window,
  document: testDom.window.document,
  navigator: testDom.window.navigator,
  IS_REACT_ACT_ENVIRONMENT: true,
})) {
  Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
}
