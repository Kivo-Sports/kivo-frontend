/**
 * Cobertura de fluxo real da Central de Times (organizador de time):
 * loading, erro, sem time, lista de times, filtros e o painel de convites.
 */

import { screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { emptyList, networkError, serverError, timeFixture, url } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { authenticatedAs, renderWithProviders } from "@/test/renderWithProviders";

import OrganizadorTimePage from "./page";

const render = () =>
  renderWithProviders(<OrganizadorTimePage />, { auth: authenticatedAs("organizadorTime") });

const outroTime = {
  ...timeFixture,
  id: "outro-time-id",
  nome: "Outro Time FC",
  ativo: false,
  esporteId: "esporte-outro",
  esporteNome: "Vôlei",
};

describe("Central de Times: loading e erro", () => {
  it("mostra loading enquanto os times carregam", async () => {
    server.use(
      http.get(url("/api/time/organizador"), async () => {
        await new Promise(() => {}); // nunca resolve neste teste
        return HttpResponse.json([]);
      }),
    );

    render();

    expect(await screen.findByLabelText("Carregando times")).toBeInTheDocument();
  });

  it("mostra ERRO (nao lista vazia) quando a API falha", async () => {
    server.use(networkError("/api/time/organizador"));

    render();

    expect(await screen.findByText("Não foi possível carregar seus times")).toBeInTheDocument();
    expect(screen.queryByText(/Você ainda não tem um time ativo/i)).not.toBeInTheDocument();
  });

  it("permite tentar novamente apos erro", async () => {
    const user = userEvent.setup();
    server.use(networkError("/api/time/organizador"));

    render();
    await screen.findByText("Não foi possível carregar seus times");

    server.use(http.get(url("/api/time/organizador"), () => HttpResponse.json([timeFixture])));
    await user.click(screen.getByRole("button", { name: /tentar novamente/i }));

    expect(await screen.findByText(timeFixture.nome)).toBeInTheDocument();
  });
});

describe("Central de Times: sem time cadastrado", () => {
  it("mostra CTA para criar o primeiro time", async () => {
    server.use(emptyList("/api/time/organizador"));

    render();

    expect(await screen.findByText("Você ainda não tem um time ativo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar meu time" })).toBeInTheDocument();
  });
});

describe("Central de Times: lista e filtros", () => {
  it("lista os times cadastrados", async () => {
    server.use(
      http.get(url("/api/time/organizador"), () => HttpResponse.json([timeFixture, outroTime])),
    );

    render();

    expect(await screen.findByText(timeFixture.nome)).toBeInTheDocument();
    expect(screen.getByText(outroTime.nome)).toBeInTheDocument();
    expect(screen.getByText("2 times encontrados")).toBeInTheDocument();
  });

  it("filtra por nome atraves da busca", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url("/api/time/organizador"), () => HttpResponse.json([timeFixture, outroTime])),
    );

    render();
    await screen.findByText(timeFixture.nome);

    await user.type(screen.getByPlaceholderText("Pesquisar time..."), "Outro");

    expect(screen.queryByText(timeFixture.nome)).not.toBeInTheDocument();
    expect(screen.getByText(outroTime.nome)).toBeInTheDocument();
  });

  it("filtra por status ativo/inativo", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url("/api/time/organizador"), () => HttpResponse.json([timeFixture, outroTime])),
    );

    render();
    await screen.findByText(timeFixture.nome);

    await user.click(screen.getByRole("button", { name: "Inativos" }));

    expect(screen.queryByText(timeFixture.nome)).not.toBeInTheDocument();
    expect(screen.getByText(outroTime.nome)).toBeInTheDocument();
  });

  it("mostra mensagem quando o filtro nao encontra nenhum time", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(url("/api/time/organizador"), () => HttpResponse.json([timeFixture])),
    );

    render();
    await screen.findByText(timeFixture.nome);

    await user.type(screen.getByPlaceholderText("Pesquisar time..."), "nao existe nenhum");

    expect(await screen.findByText("Nenhum time encontrado com estes filtros.")).toBeInTheDocument();
  });
});

describe("Central de Times: painel de convites", () => {
  it("mostra 'Carregando perfil...' enquanto o perfil ainda nao chegou", async () => {
    let resolvePerfil!: () => void;
    const perfilPendente = new Promise<void>((resolve) => {
      resolvePerfil = resolve;
    });
    server.use(
      http.get(url("/api/time/organizador"), () => HttpResponse.json([timeFixture])),
      http.get(url("/api/Usuario/:id"), async ({ params }) => {
        await perfilPendente;
        return HttpResponse.json({
          id: String(params.id),
          nome: "QA",
          email: "qa@kivo.local",
          cpf: "00000000000",
          cargo: "OrganizadorTime",
          organizadorTimeId: "org-time-1",
        });
      }),
    );

    render();
    await screen.findByText(timeFixture.nome);

    expect(screen.getByText("Carregando perfil...")).toBeInTheDocument();

    resolvePerfil();
    await waitForElementToBeRemoved(() => screen.queryByText("Carregando perfil..."));
    expect(await screen.findByText("Nenhum convite no momento")).toBeInTheDocument();
  });

  it("mostra convite pendente e permite aceitar", async () => {
    const user = userEvent.setup();
    const convite = {
      participacaoId: "part-1",
      campeonatoId: "camp-1",
      nomeCampeonato: "Copa QA",
      nomeTime: timeFixture.nome,
      convidadoEm: new Date().toISOString(),
      dataInicio: new Date().toISOString(),
      dataFim: new Date().toISOString(),
      pontosVitoria: 3,
      pontosDerrota: 0,
      pontosEmpate: 1,
      statusCampeonato: "InscricoesAbertas",
    };
    let responderChamado: unknown = null;

    server.use(
      http.get(url("/api/time/organizador"), () => HttpResponse.json([timeFixture])),
      http.get(url("/api/Usuario/:id"), ({ params }) =>
        HttpResponse.json({
          id: String(params.id),
          nome: "QA",
          email: "qa@kivo.local",
          cpf: "00000000000",
          cargo: "OrganizadorTime",
          organizadorTimeId: "org-time-1",
        }),
      ),
      http.get(url("/api/campeonato/convites-pendentes/org-time-1"), () =>
        HttpResponse.json([convite]),
      ),
      emptyList("/api/campeonato"),
      http.patch(url("/api/campeonato/responder-convite/part-1"), async ({ request }) => {
        responderChamado = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    render();

    expect(await screen.findByText("Copa QA")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /aceitar/i }));

    await waitFor(() =>
      expect(responderChamado).toEqual({ organizadorTimeId: "org-time-1", aceito: true }),
    );
  });
});
