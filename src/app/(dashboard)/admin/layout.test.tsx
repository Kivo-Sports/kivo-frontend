/**
 * Guard de cargo em /admin (dashboard). Diferente de /torcedor e
 * /organizador/*: nao mostra tela "Acesso negado" com countdown, apenas
 * redireciona direto para /dashboard e renderiza null enquanto isso.
 */

import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { routerMock } from "@/test/router";
import { authenticatedAs, hydrating, renderWithProviders, unauthenticated } from "@/test/renderWithProviders";

import AdminLayout from "./layout";

const CHILD_TEXT = "Conteudo do painel admin";

const renderLayout = (auth: Parameters<typeof renderWithProviders>[1]) =>
  renderWithProviders(
    <AdminLayout>
      <p>{CHILD_TEXT}</p>
    </AdminLayout>,
    auth,
  );

describe("guard de cargo em /admin (dashboard)", () => {
  it("permite que um Administrador veja o painel", async () => {
    renderLayout({ auth: authenticatedAs("administrador") });

    expect(await screen.findByText(CHILD_TEXT)).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it.each([
    ["Torcedor", "torcedor"],
    ["OrganizadorTime", "organizadorTime"],
    ["OrganizadorCampeonato", "organizadorCampeonato"],
  ] as const)("bloqueia %s e redireciona para /dashboard", async (_label, cargo) => {
    renderLayout({ auth: authenticatedAs(cargo) });

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/dashboard"));
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
  });

  it("nao redireciona usuario sem sessao (guard geral do dashboard cuida disso)", async () => {
    renderLayout({ auth: unauthenticated });

    await waitFor(() => {
      expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
    });
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("nao decide nada enquanto a sessao esta hidratando (mostra loading)", async () => {
    renderLayout({ auth: hydrating });

    expect(await screen.findByLabelText("Carregando painel administrativo")).toBeInTheDocument();
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
