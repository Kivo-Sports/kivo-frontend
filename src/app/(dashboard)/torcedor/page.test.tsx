/**
 * BUG-001 — Painel do Torcedor: falha de API nao pode virar estado vazio.
 * Cobre tambem os estados de loading/vazio/sucesso do painel.
 */

import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { emptyList, networkError, serverError, url } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { authenticatedAs, renderWithProviders } from "@/test/renderWithProviders";
import { http, HttpResponse } from "msw";

import TorcedorDashboardPage from "./page";

const render = () => renderWithProviders(<TorcedorDashboardPage />, { auth: authenticatedAs("torcedor") });

describe("BUG-001: painel do Torcedor mostra ERRO em vez de vazio quando a API falha", () => {
  it("mostra aviso de erro quando favoritos falha", async () => {
    server.use(serverError("/api/favorito"));

    render();

    expect(await screen.findByText("Não foi possível carregar seu painel")).toBeInTheDocument();
  });

  it("mostra aviso de erro quando a timeline falha (rede)", async () => {
    server.use(networkError("/api/favorito/timeline"));

    render();

    expect(await screen.findByText("Não foi possível carregar seu painel")).toBeInTheDocument();
  });

  it("mostra erro nos ingressos disponiveis quando a API de campeonatos falha", async () => {
    server.use(serverError("/api/campeonato"));

    render();

    expect(
      await screen.findByText("Não foi possível carregar os ingressos disponíveis"),
    ).toBeInTheDocument();
  });
});

describe("painel do Torcedor: estados vazios legitimos", () => {
  it("mostra contadores zerados e mensagens vazias quando nao ha favoritos nem jogos", async () => {
    server.use(
      emptyList("/api/favorito/timeline"),
      http.get(url("/api/favorito"), () => HttpResponse.json({ times: [], campeonatos: [] })),
      emptyList("/api/campeonato"),
      emptyList("/api/ingresso/meus-ingressos"),
    );

    render();

    expect(
      await screen.findByText(/Nenhum jogo agendado dos seus favoritos/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Não há partidas com ingressos disponíveis no momento."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Não foi possível carregar seu painel")).not.toBeInTheDocument();
  });
});

describe("painel do Torcedor: interacao", () => {
  it("abre o modal 'Seguindo' ao clicar no contador de times", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url("/api/favorito"), () =>
        HttpResponse.json({
          times: [
            { id: "t1", nome: "Time QA", logoUrl: null, cidade: "SP", estado: "SP" },
          ],
          campeonatos: [],
        }),
      ),
      emptyList("/api/favorito/timeline"),
      emptyList("/api/campeonato"),
      emptyList("/api/ingresso/meus-ingressos"),
    );

    render();

    const botaoTimes = await screen.findByTitle(/ver times que você segue/i);
    await user.click(botaoTimes);

    expect(await screen.findByRole("heading", { name: "Seguindo" })).toBeInTheDocument();
    expect(screen.getByText("Time QA")).toBeInTheDocument();
  });

  it("abre o modal 'Seguindo' na aba de campeonatos ao clicar no contador de campeonatos", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url("/api/favorito"), () =>
        HttpResponse.json({
          times: [],
          campeonatos: [
            {
              id: "c1",
              nome: "Copa QA",
              logoUrl: null,
              status: "EmAndamento",
              dataInicio: "2026-01-01T00:00:00.000Z",
              dataFim: "2026-02-01T00:00:00.000Z",
            },
          ],
        }),
      ),
      emptyList("/api/favorito/timeline"),
      emptyList("/api/campeonato"),
      emptyList("/api/ingresso/meus-ingressos"),
    );

    render();

    const botaoCampeonatos = await screen.findByTitle(/ver campeonatos que você segue/i);
    await user.click(botaoCampeonatos);

    expect(await screen.findByRole("heading", { name: "Seguindo" })).toBeInTheDocument();
    expect(screen.getByText("Copa QA")).toBeInTheDocument();
  });
});

describe("painel do Torcedor: timeline de proximos jogos", () => {
  it("lista os proximos jogos dos favoritos", async () => {
    server.use(
      http.get(url("/api/favorito"), () => HttpResponse.json({ times: [], campeonatos: [] })),
      http.get(url("/api/favorito/timeline"), () =>
        HttpResponse.json([
          {
            partidaId: "p1",
            campeonatoId: "c1",
            campeonatoNome: "Copa QA",
            timeCasa: "Time A",
            timeVisitante: "Time B",
            logoCasa: null,
            logoVisitante: null,
            dataHora: "2026-05-01T15:30:00.000Z",
            local: "Estadio QA",
            origem: "Favorito",
          },
        ]),
      ),
      emptyList("/api/campeonato"),
      emptyList("/api/ingresso/meus-ingressos"),
    );

    render();

    expect(await screen.findByText("Time A")).toBeInTheDocument();
    expect(screen.getByText("Time B")).toBeInTheDocument();
    expect(screen.getByText("Copa QA")).toBeInTheDocument();
    expect(screen.getByText("Estadio QA")).toBeInTheDocument();
  });
});

describe("painel do Torcedor: contador de ingressos", () => {
  it("mostra a quantidade de ingressos e quantos estao pagos", async () => {
    server.use(
      http.get(url("/api/favorito"), () => HttpResponse.json({ times: [], campeonatos: [] })),
      emptyList("/api/favorito/timeline"),
      emptyList("/api/campeonato"),
      http.get(url("/api/ingresso/meus-ingressos"), () =>
        HttpResponse.json([
          { id: "i1", status: 1 },
          { id: "i2", status: 0 },
        ]),
      ),
    );

    render();

    expect(await screen.findByText("2 ingressos · 1 válido")).toBeInTheDocument();
  });
});
