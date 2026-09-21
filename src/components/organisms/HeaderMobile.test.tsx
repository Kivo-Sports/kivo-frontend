import { screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { routerMock } from "@/test/router";
import { authenticatedAs, renderWithProviders, unauthenticated } from "@/test/renderWithProviders";

import { HeaderMobile } from "./HeaderMobile";

describe("HeaderMobile: usuario nao autenticado", () => {
  it("mostra botao de login e nao mostra hamburger nem avatar", async () => {
    renderWithProviders(<HeaderMobile />, { auth: unauthenticated });

    expect(await screen.findByRole("button", { name: /fazer login/i })).toBeInTheDocument();
  });
});

describe("HeaderMobile: usuario autenticado", () => {
  it("abre e fecha o menu de navegacao pelo hamburger", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderMobile />, { auth: authenticatedAs("torcedor") });

    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();

    const hamburger = await screen.findByText("☰");
    await user.click(hamburger);

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("✕")).toBeInTheDocument();

    await user.click(screen.getByText("✕"));
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("nao mostra 'Portaria' para Torcedor", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderMobile />, { auth: authenticatedAs("torcedor") });

    await user.click(await screen.findByText("☰"));
    expect(screen.queryByText("Portaria")).not.toBeInTheDocument();
  });

  it("mostra 'Portaria' para Administrador", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderMobile />, { auth: authenticatedAs("administrador") });

    await user.click(await screen.findByText("☰"));
    expect(await screen.findByText("Portaria")).toBeInTheDocument();
  });

  it("abre o dropdown do avatar e faz logout", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderMobile />, { auth: authenticatedAs("torcedor") });

    const avatarButton = (await screen.findAllByRole("button")).find((b) =>
      /^[A-Z]$/.test(b.textContent ?? ""),
    );
    expect(avatarButton).toBeDefined();
    await user.click(avatarButton!);

    const logoutButton = await screen.findByText("Desconectar");
    await user.click(logoutButton);

    expect(routerMock.push).toHaveBeenCalledWith("/login");
  });

  it("mostra 'U' como iniciais quando o usuario nao tem nome", async () => {
    renderWithProviders(<HeaderMobile />, {
      auth: {
        token: "t",
        isAuthenticated: true,
        isHydrated: true,
        user: { id: "1", name: "", email: "qa@kivo.local", cargo: "Torcedor" },
      },
    });

    expect(await screen.findByText("U")).toBeInTheDocument();
  });
});
