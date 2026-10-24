/**
 * BUG-001 + fluxo real da listagem de campeonatos: loading, erro, vazio,
 * busca, filtro de status e ordenacao.
 */

import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { emptyList, networkError, url } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { authenticatedAs, renderWithProviders } from "@/test/renderWithProviders";
import type { CampeonatoResponse } from "@/types/campeonato";

import ExplorarCampeonatosPage from "./page";

const render = () =>
  renderWithProviders(<ExplorarCampeonatosPage />, { auth: authenticatedAs("torcedor") });

function makeCampeonato(overrides: Partial<CampeonatoResponse>): CampeonatoResponse {
  return {
    id: "id-" + Math.random(),
    organizadorCampeonatoId: "org-1",
    esporteId: "esp-1",
    nome: "Campeonato QA",
    dataInicio: "2026-01-01T00:00:00.000Z",
    dataFim: "2026-02-01T00:00:00.000Z",
    logoUrl: null,
    status: "EmAndamento",
    totalTimes: 4,
    criadoEm: "2026-01-01T00:00:00.000Z",
    pontosVitoria: 3,
    pontosDerrota: 0,
    pontosEmpate: 1,
    times: [],
    formatoCampeonato: "PontosCorridos",
    quantidadeTimesClassificam: 4,
    vencedorTimeId: null,
    vencedorTimeNome: null,
    vencedorTimeLogo: null,
    ...overrides,
  };
}

describe("BUG-001: /campeonatos mostra ERRO em vez de vazio quando a API falha", () => {
  it("mostra ERRO quando a API responde com falha de rede", async () => {
    server.use(networkError("/api/campeonato"));

    render();

    expect(await screen.findByText("Não foi possível carregar os campeonatos")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum campeonato encontrado")).not.toBeInTheDocument();
  });
});

describe("/campeonatos: estados vazios", () => {
  it("mostra estado vazio quando nao ha campeonatos", async () => {
    server.use(emptyList("/api/campeonato"));

    render();

    expect(await screen.findByText("Nenhum campeonato encontrado")).toBeInTheDocument();
    expect(screen.getByText("Ainda não há campeonatos publicados.")).toBeInTheDocument();
  });

  it("esconde Rascunho e Cancelado da listagem publica", async () => {
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([
          makeCampeonato({ nome: "Rascunho Oculto", status: "Rascunho" }),
          makeCampeonato({ nome: "Cancelado Oculto", status: "Cancelado" }),
        ]),
      ),
    );

    render();

    expect(await screen.findByText("Nenhum campeonato encontrado")).toBeInTheDocument();
    expect(screen.queryByText("Rascunho Oculto")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancelado Oculto")).not.toBeInTheDocument();
  });
});

describe("/campeonatos: listagem, campeao e ordenacao", () => {
  it("lista campeonatos visiveis com Em Andamento antes de Finalizado", async () => {
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([
          makeCampeonato({ nome: "Copa Antiga", status: "Finalizado" }),
          makeCampeonato({ nome: "Copa Atual", status: "EmAndamento" }),
        ]),
      ),
    );

    render();

    const nomes = (await screen.findAllByRole("heading", { level: 2 })).map((h) => h.textContent);
    expect(nomes).toEqual(["Copa Atual", "Copa Antiga"]);
  });

  it("mostra a faixa de campeao quando o campeonato finalizado tem vencedor", async () => {
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([
          makeCampeonato({
            nome: "Copa Finalizada",
            status: "Finalizado",
            vencedorTimeNome: "Time Campeao",
            vencedorTimeLogo: null,
          }),
        ]),
      ),
    );

    render();

    expect(await screen.findByText("Campeão")).toBeInTheDocument();
    expect(screen.getByText("Time Campeao")).toBeInTheDocument();
  });
});

describe("/campeonatos: busca e filtros", () => {
  it("filtra pela busca textual", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([
          makeCampeonato({ nome: "Copa do Brasil" }),
          makeCampeonato({ nome: "Libertadores" }),
        ]),
      ),
    );

    render();
    await screen.findByText("Copa do Brasil");

    await user.type(screen.getByPlaceholderText("Buscar campeonato..."), "Liberta");

    expect(screen.queryByText("Copa do Brasil")).not.toBeInTheDocument();
    expect(screen.getByText("Libertadores")).toBeInTheDocument();
  });

  it("limpa a busca ao clicar no botao de limpar", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url("/api/campeonato"), () => HttpResponse.json([makeCampeonato({ nome: "Copa X" })])),
    );

    render();
    await screen.findByText("Copa X");

    const input = screen.getByPlaceholderText("Buscar campeonato...");
    await user.type(input, "zzz");
    expect(screen.queryByText("Copa X")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Limpar busca"));
    expect(await screen.findByText("Copa X")).toBeInTheDocument();
  });

  it("filtra por status atraves das pilulas de filtro", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([
          makeCampeonato({ nome: "Em Andamento X", status: "EmAndamento" }),
          makeCampeonato({ nome: "Finalizado X", status: "Finalizado" }),
        ]),
      ),
    );

    render();
    await screen.findByText("Em Andamento X");

    await user.click(screen.getByRole("button", { name: "Finalizados" }));

    expect(screen.queryByText("Em Andamento X")).not.toBeInTheDocument();
    expect(screen.getByText("Finalizado X")).toBeInTheDocument();
  });
});
