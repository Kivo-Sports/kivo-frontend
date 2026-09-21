/**
 * @file handlers.ts
 * @description Handlers MSW minimos para os cenarios de regressao.
 *
 * Estrategia: mockar HTTP na fronteira do fetch (nunca internals do RTK Query).
 * Cada cenario (happy / empty / 401 / 403 / 500 / network-error) tem uma
 * factory para o teste montar exatamente o que precisa via `server.use(...)`.
 */

import { http, HttpResponse, type HttpHandler } from "msw";

import { EnumTipoNotificacao, type Notificacao } from "@/types/notificacao";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5211";

export const url = (path: string) => `${API_URL}${path}`;

// ─── Fixtures ────────────────────────────────────────────────────────────────

export const notificacaoFixtures: Notificacao[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    usuarioId: "99999999-9999-9999-9999-999999999999",
    titulo: "Ingresso confirmado",
    mensagem: "Seu ingresso foi confirmado com sucesso.",
    tipo: EnumTipoNotificacao.IngressoConfirmado,
    lida: false,
    criadaEm: new Date("2026-08-30T12:00:00.000Z").toISOString(),
    linkRedirecionamento: "/dashboard",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    usuarioId: "99999999-9999-9999-9999-999999999999",
    titulo: "Partida próxima",
    mensagem: "Sua próxima partida começa em breve.",
    tipo: EnumTipoNotificacao.PartidaProxima,
    lida: true,
    criadaEm: new Date("2026-08-29T12:00:00.000Z").toISOString(),
    linkRedirecionamento: null,
  },
];

export const timeFixture = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  nome: "Time QA",
  cidade: "São Paulo",
  estado: "SP",
  ativo: true,
  esporteId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  esporteNome: "Futebol",
  logoUrl: null,
};

export const campeonatoFixture = {
  id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
  nome: "Campeonato QA",
  status: "EmAndamento",
  formato: "PontosCorridos",
  totalTimes: 4,
  organizadorCampeonatoId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
};

// ─── Cenarios genericos ──────────────────────────────────────────────────────

/** 200 com corpo arbitrario. */
export const okJson = <T,>(path: string, body: T): HttpHandler =>
  http.get(url(path), () => HttpResponse.json(body as never));

/** 200 com lista vazia (estado vazio LEGITIMO). */
export const emptyList = (path: string): HttpHandler =>
  http.get(url(path), () => HttpResponse.json([]));

/** 500 com corpo `{ message }` (uma das formas reais do backend). */
export const serverError = (path: string): HttpHandler =>
  http.get(url(path), () =>
    HttpResponse.json({ message: "Erro interno do servidor." }, { status: 500 }),
  );

/** 401 (dispara clearCredentials no baseApi). */
export const unauthorized = (path: string): HttpHandler =>
  http.get(url(path), () => HttpResponse.json({ message: "Não autorizado." }, { status: 401 }));

/** 403 com corpo string puro (outra forma real do backend). */
export const forbidden = (path: string): HttpHandler =>
  http.get(url(path), () => new HttpResponse("Acesso negado.", { status: 403 }));

/** Falha de rede (equivalente a ERR_CONNECTION_REFUSED). */
export const networkError = (path: string): HttpHandler =>
  http.get(url(path), () => HttpResponse.error());

// ─── Handlers padrao (happy path) ────────────────────────────────────────────

export const notificationHandlers: HttpHandler[] = [
  http.get(url("/api/Notificacao"), () => HttpResponse.json(notificacaoFixtures)),
  http.get(url("/api/Notificacao/contador-nao-lidas"), () => HttpResponse.json({ naoLidas: 1 })),
  http.put(url("/api/Notificacao/:id/ler"), () => new HttpResponse(null, { status: 204 })),
  http.put(url("/api/Notificacao/ler-todas"), () => new HttpResponse(null, { status: 204 })),
];

export const defaultHandlers: HttpHandler[] = [
  ...notificationHandlers,
  http.get(url("/api/time"), () => HttpResponse.json([timeFixture])),
  http.get(url("/api/campeonato"), () => HttpResponse.json([campeonatoFixture])),
  http.get(url("/api/esporte"), () =>
    HttpResponse.json([{ id: timeFixture.esporteId, nome: "Futebol", ativo: true }]),
  ),
  http.get(url("/api/favorito"), () => HttpResponse.json({ times: [], campeonatos: [] })),
  http.get(url("/api/favorito/timeline"), () => HttpResponse.json([])),
  http.get(url("/api/time/organizador"), () => HttpResponse.json([timeFixture])),
  http.get(url("/api/ingresso/meus-ingressos"), () => HttpResponse.json([])),
];
