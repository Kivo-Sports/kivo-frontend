/**
 * @file server.ts
 * @description Servidor MSW (node) compartilhado pelos testes.
 */

import { setupServer } from "msw/node";

import { defaultHandlers } from "./handlers";

export const server = setupServer(...defaultHandlers);

/**
 * Conta requisicoes por `METHOD pathname` durante um teste.
 * Usado para provar dedupe de requests (ex: double-fetch das notificacoes).
 */
export function createRequestCounter() {
  const counts = new Map<string, number>();

  const listener = ({ request }: { request: Request }) => {
    const { pathname } = new URL(request.url);
    const key = `${request.method} ${pathname}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  };

  server.events.on("request:start", listener);

  return {
    count: (method: string, pathname: string) => counts.get(`${method} ${pathname}`) ?? 0,
    all: () => Object.fromEntries(counts),
    reset: () => counts.clear(),
    stop: () => server.events.removeListener("request:start", listener),
  };
}
