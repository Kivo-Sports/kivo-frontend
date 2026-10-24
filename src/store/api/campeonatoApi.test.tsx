/**
 * Integracao hook -> request -> response -> invalidacao de cache (tag "Campeonato").
 */

import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { campeonatoFixture, url } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { authenticatedAs, renderWithProviders } from "@/test/renderWithProviders";

import {
  useCancelarCampeonatoMutation,
  useConvidarTimeMutation,
  useCriarCampeonatoMutation,
  useDescancelarCampeonatoMutation,
  useListarCampeonatosQuery,
} from "./campeonatoApi";

function ListaEAcoes() {
  const { data: campeonatos = [] } = useListarCampeonatosQuery();
  const [criar] = useCriarCampeonatoMutation();
  const [cancelar] = useCancelarCampeonatoMutation();
  const [descancelar] = useDescancelarCampeonatoMutation();
  const [convidarTime, { isSuccess: convidouComSucesso }] = useConvidarTimeMutation();

  return (
    <div>
      <ul>
        {campeonatos.map((c) => (
          <li key={c.id}>
            {c.nome} - {c.status}
          </li>
        ))}
      </ul>
      <button
        onClick={() =>
          criar({
            organizadorCampeonatoId: "org-1",
            esporteId: "esp-1",
            nome: "Copa Nova",
            dataInicio: "2026-01-01",
            dataFim: "2026-02-01",
            pontosVitoria: 3,
            pontosDerrota: 0,
            pontosEmpate: 1,
            formatoCampeonato: 0,
            quantidadeTimesClassificam: 4,
          })
        }
      >
        criar
      </button>
      <button onClick={() => cancelar(campeonatoFixture.id)}>cancelar</button>
      <button onClick={() => descancelar(campeonatoFixture.id)}>descancelar</button>
      <button onClick={() => convidarTime({ campeonatoId: campeonatoFixture.id, timeId: "time-1" })}>
        convidar
      </button>
      {convidouComSucesso && <p>Convite enviado</p>}
    </div>
  );
}

const render = () =>
  renderWithProviders(<ListaEAcoes />, { auth: authenticatedAs("organizadorCampeonato") });

describe("campeonatoApi: criarCampeonato invalida a lista", () => {
  it("apos criar, o novo campeonato aparece na lista", async () => {
    const user = userEvent.setup();
    let criado = false;
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json(criado ? [{ ...campeonatoFixture, nome: "Copa Nova" }] : []),
      ),
      http.post(url("/api/campeonato"), () => {
        criado = true;
        return HttpResponse.json({ ...campeonatoFixture, nome: "Copa Nova" });
      }),
    );

    render();
    await waitFor(() => expect(screen.queryByText(/Copa Nova/)).not.toBeInTheDocument());

    await user.click(screen.getByText("criar"));

    expect(await screen.findByText("Copa Nova - EmAndamento")).toBeInTheDocument();
  });
});

describe("campeonatoApi: cancelar / descancelar", () => {
  it("cancelar muda o status para Cancelado", async () => {
    const user = userEvent.setup();
    let cancelado = false;
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([{ ...campeonatoFixture, status: cancelado ? "Cancelado" : "EmAndamento" }]),
      ),
      http.patch(url(`/api/campeonato/${campeonatoFixture.id}/cancelar`), () => {
        cancelado = true;
        return HttpResponse.json({ ...campeonatoFixture, status: "Cancelado" });
      }),
    );

    render();
    await screen.findByText(`${campeonatoFixture.nome} - EmAndamento`);

    await user.click(screen.getByText("cancelar"));

    expect(await screen.findByText(`${campeonatoFixture.nome} - Cancelado`)).toBeInTheDocument();
  });

  it("descancelar volta o status para EmAndamento", async () => {
    const user = userEvent.setup();
    let descancelado = false;
    server.use(
      http.get(url("/api/campeonato"), () =>
        HttpResponse.json([
          { ...campeonatoFixture, status: descancelado ? "EmAndamento" : "Cancelado" },
        ]),
      ),
      http.patch(url(`/api/campeonato/${campeonatoFixture.id}/descancelar`), () => {
        descancelado = true;
        return HttpResponse.json({ ...campeonatoFixture, status: "EmAndamento" });
      }),
    );

    render();
    await screen.findByText(`${campeonatoFixture.nome} - Cancelado`);

    await user.click(screen.getByText("descancelar"));

    expect(await screen.findByText(`${campeonatoFixture.nome} - EmAndamento`)).toBeInTheDocument();
  });
});

describe("campeonatoApi: convidarTime", () => {
  it("envia o convite e reporta sucesso", async () => {
    const user = userEvent.setup();
    let corpoRecebido: unknown = null;
    server.use(
      http.get(url("/api/campeonato"), () => HttpResponse.json([campeonatoFixture])),
      http.post(url("/api/campeonato/convidar-time"), async ({ request }) => {
        corpoRecebido = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    render();
    await screen.findByText(`${campeonatoFixture.nome} - EmAndamento`);

    await user.click(screen.getByText("convidar"));

    expect(await screen.findByText("Convite enviado")).toBeInTheDocument();
    expect(corpoRecebido).toEqual({ campeonatoId: campeonatoFixture.id, timeId: "time-1" });
  });
});
