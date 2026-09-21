/**
 * BUG-006 — "Criado em" nao pode renderizar o texto literal "Invalid Date".
 */

import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

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
