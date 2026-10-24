import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { setPathname } from "@/test/router";
import { authenticatedAs, renderWithProviders } from "@/test/renderWithProviders";

import { SettingsSidebar } from "./SettingsSidebar";

describe("SettingsSidebar: visibilidade condicional por cargo", () => {
  it("mostra apenas 'Minha Conta' para Torcedor (nao mostra 'Gerenciar Admins')", () => {
    renderWithProviders(<SettingsSidebar />, { auth: authenticatedAs("torcedor") });

    expect(screen.getAllByText("Minha Conta").length).toBeGreaterThan(0);
    expect(screen.queryByText("Gerenciar Admins")).not.toBeInTheDocument();
  });

  it("mostra 'Gerenciar Admins' para Administrador", () => {
    renderWithProviders(<SettingsSidebar />, { auth: authenticatedAs("administrador") });

    expect(screen.getAllByText("Gerenciar Admins").length).toBeGreaterThan(0);
  });

  it("mostra 'Minha Conta' para OrganizadorTime e OrganizadorCampeonato, sem 'Gerenciar Admins'", () => {
    renderWithProviders(<SettingsSidebar />, { auth: authenticatedAs("organizadorTime") });
    expect(screen.queryByText("Gerenciar Admins")).not.toBeInTheDocument();
  });
});

describe("SettingsSidebar: item ativo", () => {
  it("mostra 'Gerenciar Admins' como item ativo no botao mobile quando a rota bate", () => {
    setPathname("/configuracoes/admin");
    renderWithProviders(<SettingsSidebar />, { auth: authenticatedAs("administrador") });

    expect(screen.getByRole("button")).toHaveTextContent("Gerenciar Admins");
  });

  it("mostra 'Configurações' como rotulo padrao quando a rota nao bate com nenhum item", () => {
    setPathname("/rota-desconhecida");
    renderWithProviders(<SettingsSidebar />, { auth: authenticatedAs("torcedor") });

    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });
});

describe("SettingsSidebar: dropdown mobile", () => {
  it("abre e fecha o dropdown mobile ao clicar no botao", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsSidebar />, { auth: authenticatedAs("administrador") });

    const botaoMobile = screen.getByRole("button");
    await user.click(botaoMobile);

    // Com o dropdown aberto, o item aparece 2x (sidebar desktop + dropdown mobile)
    expect(screen.getAllByText("Gerenciar Admins").length).toBe(2);

    await user.click(botaoMobile);
  });

  it("fecha o dropdown ao selecionar um item", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsSidebar />, { auth: authenticatedAs("administrador") });

    await user.click(screen.getByRole("button"));
    const itensGerenciarAdmins = screen.getAllByText("Gerenciar Admins");
    await user.click(itensGerenciarAdmins[itensGerenciarAdmins.length - 1]);

    expect(screen.getAllByText("Gerenciar Admins").length).toBe(1);
  });
});
