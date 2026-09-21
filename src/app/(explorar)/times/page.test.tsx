/**
 * BUG-001 + fluxo real da listagem de times: loading, erro, vazio, busca e
 * filtro por esporte.
 */

import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { emptyList, networkError, timeFixture, url } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { authenticatedAs, renderWithProviders } from "@/test/renderWithProviders";
import type { TimeResponse } from "@/types/time";

import ExplorarTimesPage from "./page";

const render = () => renderWithProviders(<ExplorarTimesPage />, { auth: authenticatedAs("torcedor") });

const outroTime: TimeResponse = {
  ...timeFixture,
  id: "outro-id",
  nome: "Atlético QA",
  cidade: "Rio de Janeiro",
  estado: "RJ",
  ativo: true,
  esporteId: "esporte-outro",
  esporteNome: "Vôlei",
  organizadorTimeId: "org-outro",
  criadoEm: "2026-01-01T00:00:00.000Z",
};

describe("BUG-001: /times mostra ERRO em vez de vazio quando a API falha", () => {
  it("mostra ERRO quando a API falha", async () => {
    server.use(networkError("/api/time"));

    render();

    expect(await screen.findByText("Não foi possível carregar os times")).toBeInTheDocument();
  });
});

describe("/times: estados vazios", () => {
  it("mostra estado vazio quando nao ha times", async () => {
    server.use(emptyList("/api/time"));

    render();

    expect(await screen.findByText("Nenhum time encontrado")).toBeInTheDocument();
    expect(screen.getByText("Ainda não há times cadastrados.")).toBeInTheDocument();
  });

  it("esconde times inativos da listagem publica", async () => {
    server.use(
      http.get(url("/api/time"), () =>
        HttpResponse.json([{ ...timeFixture, nome: "Time Inativo", ativo: false }]),
      ),
    );

    render();

    expect(await screen.findByText("Nenhum time encontrado")).toBeInTheDocument();
    expect(screen.queryByText("Time Inativo")).not.toBeInTheDocument();
  });
});

describe("/times: listagem, busca e filtro", () => {
  it("lista os times ativos ordenados por nome", async () => {
    server.use(
      http.get(url("/api/time"), () => HttpResponse.json([outroTime, timeFixture])),
    );

    render();

    const nomes = (await screen.findAllByRole("heading", { level: 2 })).map((h) => h.textContent);
    expect(nomes).toEqual([outroTime.nome, timeFixture.nome]);
  });

  it("filtra pela busca (nome, cidade ou estado)", async () => {
    const user = userEvent.setup();
    server.use(http.get(url("/api/time"), () => HttpResponse.json([outroTime, timeFixture])));

    render();
    await screen.findByText(timeFixture.nome);

    await user.type(screen.getByPlaceholderText(/Buscar por nome, cidade ou estado/i), "Rio de");

    expect(screen.queryByText(timeFixture.nome)).not.toBeInTheDocument();
    expect(screen.getByText(outroTime.nome)).toBeInTheDocument();
  });

  it("limpa a busca ao clicar no botao de limpar", async () => {
    const user = userEvent.setup();
    server.use(http.get(url("/api/time"), () => HttpResponse.json([timeFixture])));

    render();
    await screen.findByText(timeFixture.nome);

    const input = screen.getByPlaceholderText(/Buscar por nome, cidade ou estado/i);
    await user.type(input, "zzz");
    expect(screen.queryByText(timeFixture.nome)).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Limpar busca"));
    expect(await screen.findByText(timeFixture.nome)).toBeInTheDocument();
  });
});
