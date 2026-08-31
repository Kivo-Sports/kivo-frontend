/**
 * BUG-003 — /configuracoes/admin nao pode redirecionar antes da sessao hidratar.
 *
 * Cenario real: F5 / URL direta. No primeiro render o Redux ainda nao leu o
 * localStorage (`isHydrated === false`, `user === null`), e o guard antigo
 * interpretava isso como "nao e admin" e chamava router.push('/configuracoes').
 */

import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/test/msw/server";
import { url } from "@/test/msw/handlers";
import { routerMock } from "@/test/router";
import {
  authenticatedAs,
  hydrating,
  makeTestStore,
  renderWithProviders,
  unauthenticated,
} from "@/test/renderWithProviders";
import { setCredentials, restoreAuth } from "@/store/slices/authSlice";
import { makeUser } from "@/test/renderWithProviders";

import AdminPage from "./page";

const adminsHandler = http.get(url("/api/usuario/administradores"), () =>
  HttpResponse.json([
    {
      id: "aaaaaaaa-0000-0000-0000-000000000001",
      nome: "Administrador",
      email: "admin@kivo.com",
      ativo: true,
      criadoEm: "2026-01-15T10:00:00.000Z",
    },
  ]),
);

describe("BUG-003: guard de /configuracoes/admin e hidratacao", () => {
  it("nao redireciona enquanto a sessao ainda esta hidratando", async () => {
    renderWithProviders(<AdminPage />, { auth: hydrating });

    expect(await screen.findByLabelText("Verificando permissões")).toBeInTheDocument();

    // O bug original: push('/configuracoes') disparado no primeiro render.
    await waitFor(() => {
      expect(routerMock.push).not.toHaveBeenCalled();
    });
  });

  it("mantem o Admin na pagina quando a sessao hidrata depois (F5)", async () => {
    server.use(adminsHandler);

    // Store comeca sem sessao resolvida, como acontece num hard refresh.
    const store = makeTestStore(hydrating);
    renderWithProviders(<AdminPage />, { store });

    expect(await screen.findByLabelText("Verificando permissões")).toBeInTheDocument();
    expect(routerMock.push).not.toHaveBeenCalled();

    // localStorage e lido e a sessao de admin aparece um tick depois.
    localStorage.setItem("auth_token", "test-token");
    localStorage.setItem("auth_user", JSON.stringify(makeUser("Administrador")));
    store.dispatch(setCredentials({ token: "test-token", user: makeUser("Administrador") }));
    store.dispatch(restoreAuth());

    expect(await screen.findByRole("heading", { level: 1, name: /Gerenciar Admins/i })).toBeInTheDocument();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it("aceita cargo normalizado (nao depende da string exata 'Administrador')", async () => {
    server.use(adminsHandler);

    renderWithProviders(<AdminPage />, { auth: authenticatedAs("administrador") });

    expect(await screen.findByRole("heading", { level: 1, name: /Gerenciar Admins/i })).toBeInTheDocument();
    expect(routerMock.push).not.toHaveBeenCalled();
  });

  it.each(["torcedor", "organizadorTime", "organizadorCampeonato"] as const)(
    "continua bloqueando %s (redireciona para /configuracoes)",
    async (cargo) => {
      renderWithProviders(<AdminPage />, { auth: authenticatedAs(cargo) });

      await waitFor(() => {
        expect(routerMock.push).toHaveBeenCalledWith("/configuracoes");
      });
      expect(screen.queryByRole("heading", { level: 1, name: /Gerenciar Admins/i })).not.toBeInTheDocument();
    },
  );

  it("bloqueia usuario sem sessao apos hidratar", async () => {
    renderWithProviders(<AdminPage />, { auth: unauthenticated });

    await waitFor(() => {
      expect(routerMock.push).toHaveBeenCalledWith("/configuracoes");
    });
  });
});
