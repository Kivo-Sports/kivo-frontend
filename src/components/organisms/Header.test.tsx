import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { routerMock } from "@/test/router";
import { authenticatedAs, renderWithProviders, unauthenticated } from "@/test/renderWithProviders";

import { Header } from "./Header";

describe("Header: usuario nao autenticado", () => {
  it("mostra botao de login e nao mostra menu/notificacoes", async () => {
    renderWithProviders(<Header />, { auth: unauthenticated });

    expect(await screen.findByRole("button", { name: /fazer login/i })).toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });
});

describe("Header: usuario autenticado", () => {
  it("mostra navegacao, notificacoes e email do usuario", async () => {
    renderWithProviders(<Header />, { auth: authenticatedAs("torcedor") });

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText(/@kivo\.local/)).toBeInTheDocument();
  });

  it("nao mostra o link 'Portaria' para Torcedor", async () => {
    renderWithProviders(<Header />, { auth: authenticatedAs("torcedor") });

    await screen.findByText("Dashboard");
    expect(screen.queryByText("Portaria")).not.toBeInTheDocument();
  });

  it("mostra o link 'Portaria' para OrganizadorCampeonato e Administrador", async () => {
    renderWithProviders(<Header />, { auth: authenticatedAs("organizadorCampeonato") });
    expect(await screen.findByText("Portaria")).toBeInTheDocument();
  });

  it("abre o menu do usuario e faz logout", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />, { auth: authenticatedAs("torcedor") });

    const emailButton = await screen.findByText(/@kivo\.local/);
    await user.click(emailButton);

    const logoutButton = await screen.findByText("Desconectar");
    await user.click(logoutButton);

    expect(routerMock.push).toHaveBeenCalledWith("/login");
  });

  it("navega para /meus-ingressos ao clicar na opcao do menu", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />, { auth: authenticatedAs("torcedor") });

    await user.click(await screen.findByText(/@kivo\.local/));
    await user.click(await screen.findByText("Meus ingressos"));

    expect(routerMock.push).toHaveBeenCalledWith("/meus-ingressos");
  });
});
