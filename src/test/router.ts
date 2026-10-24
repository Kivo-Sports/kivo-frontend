/**
 * @file router.ts
 * @description Fronteira de roteamento para testes.
 *
 * `next/navigation` e mockado uma unica vez em `setup.ts` apontando para estes
 * spies. Os testes leem `routerMock.replace/push` para verificar redirecionamentos
 * (comportamento observavel) sem precisar mockar internals do Next em cada arquivo.
 */

import { vi } from "vitest";

export const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

let currentPathname = "/";
let currentSearchParams = new URLSearchParams();

export function setPathname(pathname: string) {
  currentPathname = pathname;
}

export function getPathname() {
  return currentPathname;
}

export function setSearchParams(params: Record<string, string>) {
  currentSearchParams = new URLSearchParams(params);
}

export function getSearchParams() {
  return currentSearchParams;
}

export function resetRouterMock() {
  routerMock.push.mockReset();
  routerMock.replace.mockReset();
  routerMock.back.mockReset();
  routerMock.forward.mockReset();
  routerMock.refresh.mockReset();
  routerMock.prefetch.mockReset();
  currentPathname = "/";
  currentSearchParams = new URLSearchParams();
}
