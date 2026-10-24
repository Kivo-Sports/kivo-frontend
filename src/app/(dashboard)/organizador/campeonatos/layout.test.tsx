/**
 * Guard de cargo em /organizador/campeonatos — mesmo padrao de /torcedor
 * (tela "Acesso negado" com contagem regressiva antes do redirect).
 */

import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { routerMock } from "@/test/router";
import { authenticatedAs, hydrating, renderWithProviders, unauthenticated } from "@/test/renderWithProviders";

import OrganizadorCampeonatosLayout from "./layout";

const CHILD_TEXT = "Conteudo do painel de campeonato";

const renderLayout = (auth: Parameters<typeof renderWithProviders>[1]) =>
  renderWithProviders(
    <OrganizadorCampeonatosLayout>
      <p>{CHILD_TEXT}</p>
    </OrganizadorCampeonatosLayout>,
    auth,
  );

describe("guard de cargo em /organizador/campeonatos", () => {
  it("permite que um OrganizadorCampeonato veja o painel", async () => {
    renderLayout({ auth: authenticatedAs("organizadorCampeonato") });

    expect(await screen.findByText(CHILD_TEXT)).toBeInTheDocument();
    expect(screen.queryByText("Acesso negado")).not.toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it.each([
    ["Torcedor", "torcedor"],
    ["Administrador", "administrador"],
    ["OrganizadorTime", "organizadorTime"],
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
    renderLayout({ auth: authenticatedAs("torcedor") });

    const botao = await screen.findByRole("button", { name: /ir agora/i });
    botao.click();

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/torcedor"));
  });

  it("nao decide nada enquanto a sessao esta hidratando (mostra loading)", async () => {
    renderLayout({ auth: hydrating });

    expect(await screen.findByLabelText("Verificando permissões")).toBeInTheDocument();
    expect(screen.queryByText("Acesso negado")).not.toBeInTheDocument();
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
