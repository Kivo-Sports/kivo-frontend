/**
 * BUG-004 — /torcedor precisa do mesmo guard de cargo das outras areas.
 *
 * Testa comportamento OBSERVAVEL (o que o usuario ve / para onde vai),
 * nao os internals do guard.
 */

import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { routerMock } from "@/test/router";
import {
  authenticatedAs,
  hydrating,
  renderWithProviders,
  unauthenticated,
} from "@/test/renderWithProviders";

import TorcedorLayout from "./layout";

const CHILD_TEXT = "Painel do Torcedor";

const renderLayout = (auth: Parameters<typeof renderWithProviders>[1]) =>
  renderWithProviders(
    <TorcedorLayout>
      <p>{CHILD_TEXT}</p>
    </TorcedorLayout>,
    auth,
  );

describe("BUG-004: guard de cargo em /torcedor", () => {
  it("permite que um Torcedor veja o painel", async () => {
    renderLayout({ auth: authenticatedAs("torcedor") });

    expect(await screen.findByText(CHILD_TEXT)).toBeInTheDocument();
    expect(screen.queryByText("Acesso negado")).not.toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it.each([
    ["Administrador", "administrador"],
    ["OrganizadorTime", "organizadorTime"],
    ["OrganizadorCampeonato", "organizadorCampeonato"],
  ] as const)("bloqueia %s com 'Acesso negado' e nao renderiza o painel", async (_label, cargo) => {
    renderLayout({ auth: authenticatedAs(cargo) });

    expect(await screen.findByText("Acesso negado")).toBeInTheDocument();
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
  });

  it("bloqueia usuario sem sessao (nao autenticado)", async () => {
    renderLayout({ auth: unauthenticated });

    expect(await screen.findByText("Acesso negado")).toBeInTheDocument();
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
  });

  it("oferece um botao para sair da tela de acesso negado", async () => {
    renderLayout({ auth: authenticatedAs("administrador") });

    const botao = await screen.findByRole("button", { name: /ir agora/i });
    botao.click();

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/admin"));
  });

  it("nao decide nada enquanto a sessao esta hidratando (mostra loading)", async () => {
    renderLayout({ auth: hydrating });

    expect(await screen.findByLabelText("Verificando permissões")).toBeInTheDocument();
    expect(screen.queryByText("Acesso negado")).not.toBeInTheDocument();
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
