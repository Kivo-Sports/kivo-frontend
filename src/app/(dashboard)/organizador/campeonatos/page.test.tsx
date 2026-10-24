/**
 * Cobertura de fluxo real da Central de Campeonatos (organizador de campeonato):
 * loading, erro, sem campeonato, lista filtrada por perfil, busca e status.
 */

import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { campeonatoFixture, networkError, url } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { authenticatedAs, renderWithProviders } from "@/test/renderWithProviders";

import OrganizadorCampeonatoPage from "./page";

const render = () =>
  renderWithProviders(<OrganizadorCampeonatoPage />, { auth: authenticatedAs("organizadorCampeonato") });

function perfilHandler(organizadorCampeonatoId: string) {
  return http.get(url("/api/Usuario/:id"), ({ params }) =>
    HttpResponse.json({
      id: String(params.id),
      nome: "QA",
      email: "qa@kivo.local",
      cpf: "00000000000",
      cargo: "OrganizadorCampeonato",
      organizadorCampeonatoId,
    }),
  );
}

describe("Central de Campeonatos: loading e erro", () => {
  it("mostra ERRO (nao lista vazia) quando a API falha", async () => {
    server.use(networkError("/api/campeonato"), perfilHandler("org-1"));

    render();

    expect(await screen.findByText("Não foi possível carregar seus campeonatos")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum campeonato ainda")).not.toBeInTheDocument();
  });
});

describe("Central de Campeonatos: sem campeonato cadastrado", () => {
  it("mostra CTA para criar o primeiro campeonato", async () => {
    server.use(http.get(url("/api/campeonato"), () => HttpResponse.json([])), perfilHandler("org-1"));

    render();

    expect(await screen.findByText("Nenhum campeonato ainda")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar primeiro campeonato" })).toBeInTheDocument();
  });
});

describe("Central de Campeonatos: lista filtrada pelo organizador logado", () => {
  it("mostra apenas os campeonatos do organizador logado", async () => {
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([
          { ...campeonatoFixture, nome: "Meu Campeonato", organizadorCampeonatoId: "org-1" },
          { ...campeonatoFixture, id: "outro", nome: "Campeonato de Outro", organizadorCampeonatoId: "org-2" },
        ]),
      ),
      perfilHandler("org-1"),
    );

    render();

    expect(await screen.findByText("Meu Campeonato")).toBeInTheDocument();
    expect(screen.queryByText("Campeonato de Outro")).not.toBeInTheDocument();
  });

  it("filtra pela busca textual", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([
          { ...campeonatoFixture, nome: "Copa do Brasil", organizadorCampeonatoId: "org-1" },
          { ...campeonatoFixture, id: "c2", nome: "Libertadores", organizadorCampeonatoId: "org-1" },
        ]),
      ),
      perfilHandler("org-1"),
    );

    render();
    await screen.findByText("Copa do Brasil");

    await user.type(screen.getByPlaceholderText("Pesquisar campeonato pelo nome..."), "Liberta");

    expect(screen.queryByText("Copa do Brasil")).not.toBeInTheDocument();
    expect(screen.getByText("Libertadores")).toBeInTheDocument();
  });

  it("filtra por status atraves do select de status", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([
          { ...campeonatoFixture, nome: "Em Andamento X", status: "EmAndamento", organizadorCampeonatoId: "org-1" },
          { ...campeonatoFixture, id: "c2", nome: "Finalizado X", status: "Finalizado", organizadorCampeonatoId: "org-1" },
        ]),
      ),
      perfilHandler("org-1"),
    );

    render();
    await screen.findByText("Em Andamento X");

    await user.click(screen.getByText("Todos"));
    await user.click(await screen.findByRole("button", { name: /^Finalizado/ }));

    await waitFor(() => expect(screen.queryByText("Em Andamento X")).not.toBeInTheDocument());
    expect(screen.getByText("Finalizado X")).toBeInTheDocument();
  });

  it("mostra mensagem quando o filtro nao encontra nenhum campeonato", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([{ ...campeonatoFixture, nome: "Copa X", status: "EmAndamento", organizadorCampeonatoId: "org-1" }]),
      ),
      perfilHandler("org-1"),
    );

    render();
    await screen.findByText("Copa X");

    await user.type(screen.getByPlaceholderText("Pesquisar campeonato pelo nome..."), "nao existe");

    expect(await screen.findByText("Nenhum campeonato nesta categoria")).toBeInTheDocument();
  });
});
