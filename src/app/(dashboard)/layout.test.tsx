/**
 * Guard geral de /(dashboard) — qualquer area autenticada exige sessao valida,
 * independente do cargo. Cargo especifico e responsabilidade dos guards filhos
 * (admin/layout, torcedor/layout, organizador/*\/layout).
 */

import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { routerMock } from "@/test/router";
import { authenticatedAs, hydrating, renderWithProviders, unauthenticated } from "@/test/renderWithProviders";

import DashboardRouteLayout from "./layout";

const CHILD_TEXT = "Conteudo autenticado";

const renderLayout = (auth: Parameters<typeof renderWithProviders>[1]) =>
  renderWithProviders(
    <DashboardRouteLayout>
      <p>{CHILD_TEXT}</p>
    </DashboardRouteLayout>,
    auth,
  );

describe("guard geral de /(dashboard)", () => {
  it("renderiza o conteudo para qualquer usuario autenticado", async () => {
    renderLayout({ auth: authenticatedAs("torcedor") });

    expect(await screen.findByText(CHILD_TEXT)).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("redireciona para /login quando nao ha sessao", async () => {
    renderLayout({ auth: unauthenticated });

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
  });

  it("mostra loading e nao redireciona enquanto a sessao esta hidratando", async () => {
    renderLayout({ auth: hydrating });

    expect(await screen.findByLabelText("Carregando área autenticada")).toBeInTheDocument();
    expect(screen.queryByText(CHILD_TEXT)).not.toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });
});
