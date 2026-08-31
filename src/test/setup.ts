/**
 * @file setup.ts
 * @description Setup global do Vitest: jest-dom, MSW e fronteira do Next Router.
 */

import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./msw/server";
import { getPathname, getSearchParams, resetRouterMock, routerMock } from "./router";

// ─── Fronteira de roteamento (unico mock de internals do Next) ───────────────

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => getPathname(),
  useSearchParams: () => getSearchParams(),
  useParams: () => ({}),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// ─── MSW ─────────────────────────────────────────────────────────────────────

beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetRouterMock();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});

// ─── Polyfills que o jsdom nao cobre ────────────────────────────────────────

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

if (!global.ResizeObserver) {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
