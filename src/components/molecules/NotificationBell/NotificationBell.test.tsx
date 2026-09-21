/**
 * BUG-005 — abrir o sino nao pode causar setState durante o render.
 * Double-fetch — abrir o sino deve disparar no maximo 1 GET por recurso.
 */

import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { notificacaoFixtures, url } from "@/test/msw/handlers";
import { createRequestCounter, server } from "@/test/msw/server";
import { authenticatedAs, renderWithProviders, unauthenticated } from "@/test/renderWithProviders";

import { NotificationBell } from "./NotificationBell";

const LIST_PATH = "/api/Notificacao";
const COUNT_PATH = "/api/Notificacao/contador-nao-lidas";

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

const openBell = async () => {
  const user = userEvent.setup();
  const botao = await screen.findByRole("button", { name: "Notificações" });
  await user.click(botao);
  return user;
};

describe("BUG-005: NotificationBell nao atualiza estado durante o render", () => {
  it("abre o dropdown sem nenhum aviso do React de setState-durante-render", async () => {
    renderWithProviders(<NotificationBell />, { auth: authenticatedAs("torcedor") });

    await openBell();

    expect(await screen.findByText("Notificações", { selector: "p" })).toBeInTheDocument();
    expect(await screen.findByText("Ingresso confirmado")).toBeInTheDocument();

    const chamadas = consoleErrorSpy.mock.calls as unknown[][];
    const mensagens = chamadas.map((call) => call.map(String).join(" "));
    const avisoSetState = mensagens.filter(
      (m: string) =>
        m.includes("Cannot update a component") ||
        m.includes("while rendering a different component") ||
        m.includes("setstate-in-render"),
    );

    expect(avisoSetState).toEqual([]);
  });

  it("continua buscando notificacoes e atualizando o contador ao abrir", async () => {
    const counter = createRequestCounter();

    try {
      renderWithProviders(<NotificationBell />, { auth: authenticatedAs("torcedor") });

      // Badge com o contador de nao lidas do backend.
      expect(await screen.findByText("1")).toBeInTheDocument();

      await openBell();

      await waitFor(() => {
        expect(counter.count("GET", LIST_PATH)).toBeGreaterThanOrEqual(1);
        expect(counter.count("GET", COUNT_PATH)).toBeGreaterThanOrEqual(1);
      });
    } finally {
      counter.stop();
    }
  });

  /**
   * Guard ESTRUTURAL, proposital.
   *
   * O erro do React ("Cannot update a component while rendering a different
   * component") NAO se reproduz sob jsdom + act(): foi confirmado empiricamente
   * que a versao bugada passa em todas as assercoes de comportamento acima e nao
   * emite console.error neste ambiente. A reproducao real exige navegador
   * (validada via chrome-devtools). Para nao deixar o bug sem rede de protecao,
   * este teste falha se o padrao proibido voltar ao codigo: efeito colateral
   * (refetch/setState) dentro da funcao updater passada para setIsOpen.
   */
  it("nao chama refetch de dentro da funcao updater de setIsOpen", async () => {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const source = await readFile(
      path.resolve(process.cwd(), "src/components/molecules/NotificationBell/NotificationBell.tsx"),
      "utf-8",
    );

    const updaterComEfeito = /setIsOpen\(\s*\(\s*\w*\s*\)\s*=>\s*\{[\s\S]*?refetch/;

    expect(source).not.toMatch(updaterComEfeito);
    // E o padrao correto precisa estar presente.
    expect(source).toMatch(/const next = !isOpen;/);
  });

  it("nao renderiza nada para usuario nao autenticado", () => {
    renderWithProviders(<NotificationBell />, { auth: unauthenticated });

    expect(screen.queryByRole("button", { name: "Notificações" })).not.toBeInTheDocument();
  });
});

describe("Double-fetch: abrir o dropdown nao duplica requisicoes", () => {
  it("dispara no maximo 1 GET de lista e 1 de contador por abertura", async () => {
    const counter = createRequestCounter();

    try {
      renderWithProviders(<NotificationBell />, { auth: authenticatedAs("torcedor") });

      // Espera as queries iniciais (montagem) assentarem.
      expect(await screen.findByText("1")).toBeInTheDocument();
      await waitFor(() => {
        expect(counter.count("GET", COUNT_PATH)).toBeGreaterThanOrEqual(1);
      });

      const listaAntes = counter.count("GET", LIST_PATH);
      const contadorAntes = counter.count("GET", COUNT_PATH);

      await openBell();
      expect(await screen.findByText("Ingresso confirmado")).toBeInTheDocument();

      // Dá tempo para qualquer refetch duplicado aparecer.
      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(counter.count("GET", LIST_PATH) - listaAntes).toBeLessThanOrEqual(1);
      expect(counter.count("GET", COUNT_PATH) - contadorAntes).toBeLessThanOrEqual(1);
    } finally {
      counter.stop();
    }
  });
});

describe("NotificationBell: marcar como lida", () => {
  it("marca uma notificacao como lida ao clicar nela", async () => {
    const marcarUma = vi.fn();
    server.use(
      http.put(url("/api/Notificacao/:id/ler"), ({ params }) => {
        marcarUma(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
      http.get(url(LIST_PATH), () =>
        HttpResponse.json(notificacaoFixtures.map((n) => ({ ...n, lida: true }))),
      ),
      http.get(url(COUNT_PATH), () => HttpResponse.json({ naoLidas: 0 })),
    );

    // Primeira carga precisa ter uma nao lida para haver algo a marcar.
    server.use(http.get(url(LIST_PATH), () => HttpResponse.json(notificacaoFixtures)));

    renderWithProviders(<NotificationBell />, { auth: authenticatedAs("torcedor") });

    const user = await openBell();
    const item = await screen.findByText("Ingresso confirmado");
    await user.click(item);

    await waitFor(() => {
      expect(marcarUma).toHaveBeenCalledWith(notificacaoFixtures[0].id);
    });
  });

  it("marca todas como lidas pelo botao do cabecalho", async () => {
    const marcarTodas = vi.fn();
    server.use(
      http.put(url("/api/Notificacao/ler-todas"), () => {
        marcarTodas();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    renderWithProviders(<NotificationBell />, { auth: authenticatedAs("torcedor") });

    const user = await openBell();
    const botao = await screen.findByRole("button", { name: /marcar todas/i });
    await user.click(botao);

    await waitFor(() => expect(marcarTodas).toHaveBeenCalled());
  });

  it("mostra estado de erro (nao estado vazio) quando a lista falha", async () => {
    server.use(
      http.get(url(LIST_PATH), () => HttpResponse.error()),
      http.get(url(COUNT_PATH), () => HttpResponse.error()),
    );

    renderWithProviders(<NotificationBell />, { auth: authenticatedAs("torcedor") });

    await openBell();

    expect(await screen.findByText(/não foi possível carregar/i)).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /tentar novamente/i })).toBeInTheDocument();
  });
});
