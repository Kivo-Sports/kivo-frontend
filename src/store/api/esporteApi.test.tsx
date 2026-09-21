import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { url } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { authenticatedAs, renderWithProviders } from "@/test/renderWithProviders";

import {
  useCriarEsporteMutation,
  useListarEsportesQuery,
  useRemoverEsporteMutation,
  useToggleStatusEsporteMutation,
} from "./esporteApi";

const esporteFixture = { id: "esp-1", nome: "Futebol", ativo: true };

function ListaEAcoes() {
  const { data: esportes = [] } = useListarEsportesQuery();
  const [criar] = useCriarEsporteMutation();
  const [toggle] = useToggleStatusEsporteMutation();
  const [remover] = useRemoverEsporteMutation();

  return (
    <div>
      <ul>
        {esportes.map((e) => (
          <li key={e.id}>
            {e.nome} - {e.ativo ? "ativo" : "inativo"}
          </li>
        ))}
      </ul>
      <button onClick={() => criar({ nome: "Vôlei", icone: "mdi:volleyball" })}>criar</button>
      <button onClick={() => toggle(esporteFixture.id)}>alternar-status</button>
      <button onClick={() => remover(esporteFixture.id)}>remover</button>
    </div>
  );
}

const render = () => renderWithProviders(<ListaEAcoes />, { auth: authenticatedAs("administrador") });

describe("esporteApi: criarEsporte invalida a lista", () => {
  it("apos criar, o novo esporte aparece na lista", async () => {
    const user = userEvent.setup();
    let criado = false;
    server.use(
      http.get(url("/api/esporte"), () =>
        HttpResponse.json(criado ? [{ id: "esp-2", nome: "Vôlei", ativo: true }] : []),
      ),
      http.post(url("/api/esporte"), () => {
        criado = true;
        return HttpResponse.json({ id: "esp-2", nome: "Vôlei", ativo: true });
      }),
    );

    render();
    await waitFor(() => expect(screen.queryByText(/Vôlei/)).not.toBeInTheDocument());

    await user.click(screen.getByText("criar"));

    expect(await screen.findByText("Vôlei - ativo")).toBeInTheDocument();
  });
});

describe("esporteApi: toggleStatusEsporte", () => {
  it("alterna o esporte para inativo", async () => {
    const user = userEvent.setup();
    let alternado = false;
    server.use(
      http.get(url("/api/esporte"), () =>
        HttpResponse.json([{ ...esporteFixture, ativo: !alternado }]),
      ),
      http.patch(url(`/api/esporte/${esporteFixture.id}/status`), () => {
        alternado = true;
        return HttpResponse.json({ ...esporteFixture, ativo: false });
      }),
    );

    render();
    await screen.findByText("Futebol - ativo");

    await user.click(screen.getByText("alternar-status"));

    expect(await screen.findByText("Futebol - inativo")).toBeInTheDocument();
  });
});

describe("esporteApi: removerEsporte", () => {
  it("remove o esporte da lista", async () => {
    const user = userEvent.setup();
    let removido = false;
    server.use(
      http.get(url("/api/esporte"), () => HttpResponse.json(removido ? [] : [esporteFixture])),
      http.delete(url(`/api/esporte/${esporteFixture.id}`), () => {
        removido = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    render();
    await screen.findByText("Futebol - ativo");

    await user.click(screen.getByText("remover"));

    await waitFor(() => expect(screen.queryByText("Futebol - ativo")).not.toBeInTheDocument());
  });
});
