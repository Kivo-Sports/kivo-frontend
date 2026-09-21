/**
 * BUG-001 — falha de API nao pode ser renderizada como estado vazio.
 *
 * Para cada tela critica, tres cenarios com MSW:
 *   - 500            -> UI de ERRO distinta
 *   - network error  -> UI de ERRO distinta (equivalente a ERR_CONNECTION_REFUSED)
 *   - 200 []         -> UI de VAZIO legitima (e NAO a de erro)
 */

import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { emptyList, networkError, serverError } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { authenticatedAs, renderWithProviders } from "@/test/renderWithProviders";

import ExplorarTimesPage from "./(explorar)/times/page";
import ExplorarCampeonatosPage from "./(explorar)/campeonatos/page";
import AdminOverviewPage from "./(dashboard)/admin/page";
import OrganizadorTimePage from "./(dashboard)/organizador/times/page";

const errorState = () => screen.queryByTestId("error-state");
const findErrorState = () => screen.findByTestId("error-state");

// ─── /times ──────────────────────────────────────────────────────────────────

describe("BUG-001: /times", () => {
  it("mostra estado de ERRO quando a API responde 500", async () => {
    server.use(serverError("/api/time"));
    renderWithProviders(<ExplorarTimesPage />, { auth: authenticatedAs("torcedor") });

    expect(await findErrorState()).toBeInTheDocument();
    expect(screen.queryByText("Nenhum time encontrado")).not.toBeInTheDocument();
    expect(screen.queryByText(/Ainda não há times cadastrados/i)).not.toBeInTheDocument();
  });

  it("mostra estado de ERRO quando a rede falha", async () => {
    server.use(networkError("/api/time"));
    renderWithProviders(<ExplorarTimesPage />, { auth: authenticatedAs("torcedor") });

    expect(await findErrorState()).toBeInTheDocument();
    expect(screen.queryByText("Nenhum time encontrado")).not.toBeInTheDocument();
  });

  it("mostra estado VAZIO (e nao de erro) quando a API responde 200 []", async () => {
    server.use(emptyList("/api/time"));
    renderWithProviders(<ExplorarTimesPage />, { auth: authenticatedAs("torcedor") });

    expect(await screen.findByText("Nenhum time encontrado")).toBeInTheDocument();
    expect(errorState()).not.toBeInTheDocument();
  });
});

// ─── /campeonatos ────────────────────────────────────────────────────────────

describe("BUG-001: /campeonatos", () => {
  it("mostra estado de ERRO quando a API responde 500", async () => {
    server.use(serverError("/api/campeonato"));
    renderWithProviders(<ExplorarCampeonatosPage />, { auth: authenticatedAs("torcedor") });

    expect(await findErrorState()).toBeInTheDocument();
    expect(screen.queryByText("Nenhum campeonato encontrado")).not.toBeInTheDocument();
    expect(screen.queryByText(/Ainda não há campeonatos publicados/i)).not.toBeInTheDocument();
  });

  it("mostra estado de ERRO quando a rede falha", async () => {
    server.use(networkError("/api/campeonato"));
    renderWithProviders(<ExplorarCampeonatosPage />, { auth: authenticatedAs("torcedor") });

    expect(await findErrorState()).toBeInTheDocument();
  });

  it("mostra estado VAZIO (e nao de erro) quando a API responde 200 []", async () => {
    server.use(emptyList("/api/campeonato"));
    renderWithProviders(<ExplorarCampeonatosPage />, { auth: authenticatedAs("torcedor") });

    expect(await screen.findByText("Nenhum campeonato encontrado")).toBeInTheDocument();
    expect(errorState()).not.toBeInTheDocument();
  });
});

// ─── /admin ──────────────────────────────────────────────────────────────────

describe("BUG-001: /admin (metricas)", () => {
  it("mostra estado de ERRO em vez de metricas zeradas quando a API falha", async () => {
    server.use(
      networkError("/api/campeonato"),
      networkError("/api/time"),
      networkError("/api/esporte"),
    );
    renderWithProviders(<AdminOverviewPage />, { auth: authenticatedAs("administrador") });

    expect(await findErrorState()).toBeInTheDocument();
    // "0" zerado nao pode aparecer como se fosse dado real.
    expect(screen.queryByText("Campeonatos")).not.toBeInTheDocument();
  });

  it("mostra metricas zeradas legitimas quando a API responde 200 []", async () => {
    server.use(
      emptyList("/api/campeonato"),
      emptyList("/api/time"),
      emptyList("/api/esporte"),
    );
    renderWithProviders(<AdminOverviewPage />, { auth: authenticatedAs("administrador") });

    expect(await screen.findByText("Campeonatos")).toBeInTheDocument();
    expect(errorState()).not.toBeInTheDocument();
  });
});

// ─── /organizador/times ──────────────────────────────────────────────────────

describe("BUG-001: /organizador/times", () => {
  it("mostra ERRO em vez de 'Você ainda não tem um time ativo' quando a API falha", async () => {
    server.use(networkError("/api/time/organizador"));
    renderWithProviders(<OrganizadorTimePage />, { auth: authenticatedAs("organizadorTime") });

    expect(await findErrorState()).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText(/Você ainda não tem um time ativo/i)).not.toBeInTheDocument();
    });
  });

  it("mostra o estado vazio legitimo quando a API responde 200 []", async () => {
    server.use(emptyList("/api/time/organizador"));
    renderWithProviders(<OrganizadorTimePage />, { auth: authenticatedAs("organizadorTime") });

    expect(await screen.findByText(/Você ainda não tem um time ativo/i)).toBeInTheDocument();
    expect(errorState()).not.toBeInTheDocument();
  });
});
