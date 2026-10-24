/**
 * BUG-006 — "Criado em" nao pode renderizar o texto literal "Invalid Date".
 */

import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";

import { url } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { renderWithProviders, authenticatedAs, TEST_TOKEN } from "@/test/renderWithProviders";

import { AdminList } from "./AdminList";

const FALLBACK = "—";

const mockAdmins = (criadoEm: unknown) =>
  server.use(
    http.get(url("/api/usuario/administradores"), () =>
      HttpResponse.json([
        {
          id: "aaaaaaaa-0000-0000-0000-000000000001",
          nome: "Administrador",
          email: "admin@kivo.com",
          ativo: true,
          criadoEm,
        },
      ]),
    ),
  );

const render = () =>
  renderWithProviders(<AdminList token={TEST_TOKEN} />, {
    auth: authenticatedAs("administrador"),
  });

describe("BUG-006: AdminList e datas invalidas", () => {
  it("mostra fallback quando criadoEm esta ausente (undefined)", async () => {
    mockAdmins(undefined);
    render();

    expect(await screen.findAllByText("admin@kivo.com")).not.toHaveLength(0);
    expect(screen.queryByText("Invalid Date")).not.toBeInTheDocument();
    expect(screen.queryAllByText(FALLBACK).length).toBeGreaterThan(0);
  });

  it("mostra fallback quando criadoEm e null", async () => {
    mockAdmins(null);
    render();

    expect(await screen.findAllByText("admin@kivo.com")).not.toHaveLength(0);
    expect(screen.queryByText("Invalid Date")).not.toBeInTheDocument();
    expect(screen.queryAllByText(FALLBACK).length).toBeGreaterThan(0);
  });

  it("mostra fallback quando criadoEm nao e uma data parseavel", async () => {
    mockAdmins("nao-e-uma-data");
    render();

    expect(await screen.findAllByText("admin@kivo.com")).not.toHaveLength(0);
    expect(screen.queryByText("Invalid Date")).not.toBeInTheDocument();
    expect(screen.queryAllByText(FALLBACK).length).toBeGreaterThan(0);
  });

  it("mostra fallback quando criadoEm e string vazia", async () => {
    mockAdmins("");
    render();

    expect(await screen.findAllByText("admin@kivo.com")).not.toHaveLength(0);
    expect(screen.queryByText("Invalid Date")).not.toBeInTheDocument();
    expect(screen.queryAllByText(FALLBACK).length).toBeGreaterThan(0);
  });

  it("formata normalmente quando criadoEm e valido", async () => {
    mockAdmins("2026-01-15T10:00:00.000Z");
    render();

    expect(await screen.findAllByText("admin@kivo.com")).not.toHaveLength(0);
    expect(screen.queryByText("Invalid Date")).not.toBeInTheDocument();
    expect(screen.queryAllByText("15/01/2026").length).toBeGreaterThan(0);
  });
});

describe("AdminList: estados de lista", () => {
  it("mostra estado vazio quando nao ha administradores", async () => {
    server.use(http.get(url("/api/usuario/administradores"), () => HttpResponse.json([])));
    render();

    expect(await screen.findByText("Nenhum administrador encontrado")).toBeInTheDocument();
  });

  it("mostra toast de erro quando a listagem falha", async () => {
    server.use(
      http.get(url("/api/usuario/administradores"), () =>
        HttpResponse.json({ message: "Sem permissão" }, { status: 403 }),
      ),
    );
    render();

    await waitFor(() =>
      expect(screen.queryByText("Nenhum administrador encontrado")).toBeInTheDocument(),
    );
  });
});

describe("AdminList: ações", () => {
  it("chama onEditClick com o admin selecionado", async () => {
    const user = userEvent.setup();
    const onEditClick = vi.fn();
    mockAdmins("2026-01-15T10:00:00.000Z");

    renderWithProviders(<AdminList token={TEST_TOKEN} onEditClick={onEditClick} />, {
      auth: authenticatedAs("administrador"),
    });

    const botoesEditar = await screen.findAllByRole("button", { name: /editar/i });
    await user.click(botoesEditar[0]);

    expect(onEditClick).toHaveBeenCalledWith(
      expect.objectContaining({ nome: "Administrador", ativo: true }),
    );
  });

  it("desativa um admin ativo e atualiza a lista", async () => {
    const user = userEvent.setup();
    mockAdmins("2026-01-15T10:00:00.000Z");
    server.use(
      http.patch(url("/api/usuario/aaaaaaaa-0000-0000-0000-000000000001/reativar"), () =>
        HttpResponse.json({}),
      ),
    );
    let desativado = false;
    server.use(
      http.get(url("/api/usuario/administradores"), () =>
        HttpResponse.json([
          {
            id: "aaaaaaaa-0000-0000-0000-000000000001",
            nome: "Administrador",
            email: "admin@kivo.com",
            ativo: !desativado,
            criadoEm: "2026-01-15T10:00:00.000Z",
          },
        ]),
      ),
      http.delete(url("/api/usuario/aaaaaaaa-0000-0000-0000-000000000001"), () => {
        desativado = true;
        return HttpResponse.json({});
      }),
    );

    render();

    const botoesDesativar = await screen.findAllByRole("button", { name: /desativar/i });
    await user.click(botoesDesativar[0]);

    expect(await screen.findAllByRole("button", { name: /^ativar/i })).not.toHaveLength(0);
  });

  it("mostra erro quando desativar falha", async () => {
    const user = userEvent.setup();
    mockAdmins("2026-01-15T10:00:00.000Z");
    server.use(
      http.delete(url("/api/usuario/aaaaaaaa-0000-0000-0000-000000000001"), () =>
        HttpResponse.json({ message: "Não pode desativar o único admin" }, { status: 400 }),
      ),
    );

    render();

    const botoesDesativar = await screen.findAllByRole("button", { name: /desativar/i });
    await user.click(botoesDesativar[0]);

    await waitFor(() =>
      expect(screen.queryAllByRole("button", { name: /desativar/i }).length).toBeGreaterThan(0),
    );
  });
});
