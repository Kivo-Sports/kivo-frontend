/**
 * Integracao hook -> request -> response -> invalidacao de cache (tag "Time").
 * Mocka a fronteira HTTP com MSW; nao mocka internals do RTK Query.
 */

import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { timeFixture, url } from "@/test/msw/handlers";
import { server } from "@/test/msw/server";
import { authenticatedAs, renderWithProviders } from "@/test/renderWithProviders";

import {
  useAtualizarTimeMutation,
  useCriarTimeMutation,
  useListarTimesOrganizadorQuery,
  useRemoverTimeMutation,
  useToggleStatusTimeMutation,
} from "./timeApi";

function ListaEAcoes() {
  const { data: times = [] } = useListarTimesOrganizadorQuery();
  const [criarTime] = useCriarTimeMutation();
  const [atualizarTime] = useAtualizarTimeMutation();
  const [toggleStatus] = useToggleStatusTimeMutation();
  const [removerTime] = useRemoverTimeMutation();

  return (
    <div>
      <ul>
        {times.map((t) => (
          <li key={t.id}>
            {t.nome} - {t.ativo ? "ativo" : "inativo"}
          </li>
        ))}
      </ul>
      <button
        onClick={() =>
          criarTime({
            organizadorTimeId: "org-1",
            esporteId: "esp-1",
            nome: "Time Novo",
            cidade: "SP",
            estado: "SP",
          })
        }
      >
        criar
      </button>
      <button onClick={() => atualizarTime({ id: timeFixture.id, esporteId: "esp-1", nome: "Time Renomeado", cidade: "SP", estado: "SP" })}>
        atualizar
      </button>
      <button onClick={() => toggleStatus(timeFixture.id)}>alternar-status</button>
      <button onClick={() => removerTime(timeFixture.id)}>remover</button>
    </div>
  );
}

const render = () => renderWithProviders(<ListaEAcoes />, { auth: authenticatedAs("organizadorTime") });

describe("timeApi: criarTime invalida a lista e o novo time aparece", () => {
  it("apos criar, a lista de times do organizador e re-buscada", async () => {
    const user = userEvent.setup();
    let vezes = 0;
    server.use(
      http.get(url("/api/time/organizador"), () => {
        vezes += 1;
        return HttpResponse.json(vezes === 1 ? [] : [{ ...timeFixture, nome: "Time Novo" }]);
      }),
      http.post(url("/api/time"), () => HttpResponse.json({ ...timeFixture, nome: "Time Novo" })),
    );

    render();
    await waitFor(() => expect(vezes).toBe(1));

    await user.click(screen.getByText("criar"));

    await screen.findByText("Time Novo - ativo");
    expect(vezes).toBe(2);
  });
});

describe("timeApi: atualizarTime invalida a lista", () => {
  it("apos atualizar, o nome exibido muda", async () => {
    const user = userEvent.setup();
    let atualizado = false;
    server.use(
      http.get(url("/api/time/organizador"), () =>
        HttpResponse.json([atualizado ? { ...timeFixture, nome: "Time Renomeado" } : timeFixture]),
      ),
      http.put(url(`/api/time/${timeFixture.id}`), () => {
        atualizado = true;
        return HttpResponse.json({ ...timeFixture, nome: "Time Renomeado" });
      }),
    );

    render();
    await screen.findByText(`${timeFixture.nome} - ativo`);

    await user.click(screen.getByText("atualizar"));

    expect(await screen.findByText("Time Renomeado - ativo")).toBeInTheDocument();
  });
});

describe("timeApi: toggleStatusTime alterna o status", () => {
  it("apos alternar, o time aparece como inativo", async () => {
    const user = userEvent.setup();
    let alternado = false;
    server.use(
      http.get(url("/api/time/organizador"), () =>
        HttpResponse.json([{ ...timeFixture, ativo: !alternado }]),
      ),
      http.patch(url(`/api/time/${timeFixture.id}/status`), () => {
        alternado = true;
        return HttpResponse.json({ ...timeFixture, ativo: false });
      }),
    );

    render();
    await screen.findByText(`${timeFixture.nome} - ativo`);

    await user.click(screen.getByText("alternar-status"));

    expect(await screen.findByText(`${timeFixture.nome} - inativo`)).toBeInTheDocument();
  });
});

describe("timeApi: removerTime invalida a lista", () => {
  it("apos remover, o time some da lista", async () => {
    const user = userEvent.setup();
    let removido = false;
    server.use(
      http.get(url("/api/time/organizador"), () => HttpResponse.json(removido ? [] : [timeFixture])),
      http.delete(url(`/api/time/${timeFixture.id}`), () => {
        removido = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    render();
    await screen.findByText(`${timeFixture.nome} - ativo`);

    await user.click(screen.getByText("remover"));

    await waitFor(() => expect(screen.queryByText(`${timeFixture.nome} - ativo`)).not.toBeInTheDocument());
  });
});
