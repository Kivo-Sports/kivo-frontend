import { http, HttpResponse } from "msw";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminDashboard } from "./AdminDashboard";
import { authenticatedAs, makeUser, renderWithProviders } from "@/test/renderWithProviders";
import { setCredentials } from "@/store/slices/authSlice";
import { server } from "@/test/msw/server";
import {
  okJson,
  relatorioAdministrativoFixture,
  serverError,
  timeFixture,
  url,
} from "@/test/msw/handlers";
import { montarIndicadores } from "@/lib/relatorio.utils";
import type { RelatorioAdministrativo } from "@/types/relatorio";

const ROTA = "/api/relatorios/administrativo";

/** Registra os query params de cada chamada ao relatório para assertar os filtros enviados. */
function capturarRequisicoes() {
  const chamadas: URLSearchParams[] = [];
  server.use(
    http.get(url(ROTA), ({ request }) => {
      chamadas.push(new URL(request.url).searchParams);
      return HttpResponse.json(relatorioAdministrativoFixture);
    }),
  );
  return chamadas;
}

const renderizar = () =>
  renderWithProviders(<AdminDashboard />, { auth: authenticatedAs("administrador") });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AdminDashboard", () => {
  it("mostra os indicadores do relatório", async () => {
    renderizar();

    expect(await screen.findByText(/1\.250,50/)).toBeInTheDocument();
    expect(screen.getByText("Receita confirmada")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("Novos usuários")).toBeInTheDocument();
    expect(screen.getByText("Partidas realizadas")).toBeInTheDocument();
  });

  it("começa nos últimos 30 dias e envia início e fim", async () => {
    const chamadas = capturarRequisicoes();
    renderizar();

    await waitFor(() => expect(chamadas).toHaveLength(1));
    expect(chamadas[0].get("inicio")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(chamadas[0].get("fim")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(chamadas[0].has("esporteId")).toBe(false);
    expect(screen.getByRole("button", { name: "30 dias" })).toHaveAttribute("aria-pressed", "true");
  });

  it("restaura os filtros salvos antes da primeira consulta e permite limpar a preferência", async () => {
    const userId = authenticatedAs("administrador").user!.id;
    const key = `kivo:admin-filters:v1:user:${userId}`;
    localStorage.setItem(key, JSON.stringify({
      selecao: "personalizado",
      inicio: "2026-09-01",
      fim: "2026-09-30",
      esporteId: timeFixture.esporteId,
    }));
    const chamadas = capturarRequisicoes();
    const user = userEvent.setup();
    renderizar();

    await waitFor(() => expect(chamadas).toHaveLength(1));
    expect(chamadas[0].get("inicio")).toBe("2026-09-01");
    expect(chamadas[0].get("fim")).toBe("2026-09-30");
    expect(chamadas[0].get("esporteId")).toBe(timeFixture.esporteId);
    expect(screen.getByRole("button", { name: "Personalizado" })).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "7 dias" }));
    await waitFor(() => expect(chamadas).toHaveLength(2));
    expect(JSON.parse(localStorage.getItem(key) ?? "{}")).toMatchObject({ inicio: "2026-09-01", fim: "2026-09-30", selecao: "7d" });
    await user.click(screen.getByRole("button", { name: "Personalizado" }));
    expect(screen.getByLabelText("Data inicial")).toHaveValue("2026-09-01");
    expect(screen.getByLabelText("Data final")).toHaveValue("2026-09-30");

    await user.click(screen.getByRole("button", { name: "Restaurar padrão" }));
    await waitFor(() => expect(chamadas.length).toBeGreaterThan(2));
    expect(chamadas.at(-1)?.has("esporteId")).toBe(false);
    expect(localStorage.getItem(key)).toBeNull();

    await user.click(screen.getByRole("button", { name: "Tudo" }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(key) ?? "{}").selecao).toBe("tudo"));
  });

  it.each([
    { inicio: "2026-02-30", fim: "2026-03-10" },
    { inicio: "", fim: "9999-12-31" },
    { inicio: "0000-01-01", fim: "" },
  ])("ignora intervalo salvo fora do calendário suportado ($inicio a $fim)", async ({ inicio, fim }) => {
    const userId = authenticatedAs("administrador").user!.id;
    const key = `kivo:admin-filters:v1:user:${userId}`;
    localStorage.setItem(key, JSON.stringify({ selecao: "personalizado", inicio, fim, esporteId: "todos" }));
    const chamadas = capturarRequisicoes();
    const user = userEvent.setup();
    renderizar();

    await waitFor(() => expect(chamadas).toHaveLength(1));
    expect(chamadas[0].get("inicio")).not.toBe(inicio);
    expect(chamadas[0].get("fim")).not.toBe(fim);
    expect(screen.getByRole("button", { name: "30 dias" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "7 dias" }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(key) ?? "{}")).toMatchObject({ selecao: "7d", inicio: "", fim: "" }));
    await user.click(screen.getByRole("button", { name: "Personalizado" }));
    expect(screen.getByLabelText("Data inicial")).toHaveValue("");
    expect(screen.getByLabelText("Data final")).toHaveValue("");
  });

  it("não reaproveita o filtro da conta anterior durante troca de identidade", async () => {
    const primeiraConta = authenticatedAs("administrador");
    const segundaConta = makeUser("Administrador", { id: "88888888-8888-8888-8888-888888888888" });
    localStorage.setItem(`kivo:admin-filters:v1:user:${segundaConta.id}`, JSON.stringify({ selecao: "90d", inicio: "", fim: "", esporteId: "todos" }));
    const chamadas = capturarRequisicoes();
    const { store } = renderWithProviders(<AdminDashboard />, { auth: primeiraConta });
    await waitFor(() => expect(chamadas).toHaveLength(1));

    store.dispatch(setCredentials({ token: "qa-token", user: segundaConta }));

    await waitFor(() => expect(chamadas).toHaveLength(2));
    expect(chamadas[1].get("inicio")).not.toBe(chamadas[0].get("inicio"));
    expect(chamadas[1].get("esporteId")).toBeNull();
    expect(screen.getByRole("button", { name: "90 dias" })).toHaveAttribute("aria-pressed", "true");
  });

  it("'Tudo' remove os limites de data", async () => {
    const chamadas = capturarRequisicoes();
    const user = userEvent.setup();
    renderizar();
    await waitFor(() => expect(chamadas).toHaveLength(1));

    await user.click(screen.getByRole("button", { name: "Tudo" }));

    await waitFor(() => expect(chamadas).toHaveLength(2));
    expect(chamadas[1].has("inicio")).toBe(false);
    expect(chamadas[1].has("fim")).toBe(false);
  });

  it("filtrar por esporte envia o esporteId e avisa que usuários não são filtrados", async () => {
    const chamadas = capturarRequisicoes();
    const user = userEvent.setup();
    renderizar();
    await waitFor(() => expect(chamadas).toHaveLength(1));

    await user.click(screen.getByTitle("Filtrar por esporte"));
    await user.click(await screen.findByRole("option", { name: /Futebol/ }));

    await waitFor(() => expect(chamadas).toHaveLength(2));
    expect(chamadas[1].get("esporteId")).toBe(timeFixture.esporteId);
    expect(await screen.findByRole("note")).toHaveTextContent(/não são filtrados por esporte/i);
  });

  it("combina esporte (pelo teclado) e período na mesma consulta", async () => {
    const chamadas = capturarRequisicoes();
    const user = userEvent.setup();
    renderizar();
    await waitFor(() => expect(chamadas).toHaveLength(1));

    screen.getByRole("button", { name: /Filtrar por esporte/ }).focus();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("listbox");
    await user.keyboard("{ArrowDown}{Enter}");
    await user.click(screen.getByRole("button", { name: "7 dias" }));

    await waitFor(() =>
      expect(
        chamadas.some(
          (c) => c.get("esporteId") === timeFixture.esporteId && c.has("inicio") && c.has("fim"),
        ),
      ).toBe(true),
    );
    expect(screen.getByText("Período:").parentElement).toHaveTextContent(/\d{2}\/\d{2}\/\d{4} a/);
    expect(screen.getByText("Esporte:").parentElement).toHaveTextContent("Futebol");
  });

  it("período personalizado inválido mostra erro e não consulta a API", async () => {
    const chamadas = capturarRequisicoes();
    const user = userEvent.setup();
    renderizar();
    await waitFor(() => expect(chamadas).toHaveLength(1));

    await user.click(screen.getByRole("button", { name: "Personalizado" }));
    await user.type(screen.getByLabelText("Data inicial"), "2026-10-10");
    await user.type(screen.getByLabelText("Data final"), "2026-10-01");

    expect(await screen.findByText(/data final deve ser igual ou posterior/i)).toBeInTheDocument();
    expect(chamadas.every((c) => c.get("fim") !== "2026-10-01")).toBe(true);
  });

  it("período personalizado acima de 10 anos é recusado sem consultar a API", async () => {
    const chamadas = capturarRequisicoes();
    const user = userEvent.setup();
    renderizar();
    await waitFor(() => expect(chamadas).toHaveLength(1));

    await user.click(screen.getByRole("button", { name: "Personalizado" }));
    await user.type(screen.getByLabelText("Data inicial"), "2001-01-01");
    await user.type(screen.getByLabelText("Data final"), "2026-10-05");

    expect(await screen.findByRole("alert")).toHaveTextContent(/no máximo 10 anos/);
    expect(screen.getByLabelText("Data final")).toHaveAttribute("aria-invalid", "true");
    expect(
      chamadas.some((c) => c.get("inicio") === "2001-01-01" && c.get("fim") === "2026-10-05"),
    ).toBe(false);
  });

  it("período personalizado válido envia as datas escolhidas", async () => {
    const chamadas = capturarRequisicoes();
    const user = userEvent.setup();
    renderizar();
    await waitFor(() => expect(chamadas).toHaveLength(1));

    await user.click(screen.getByRole("button", { name: "Personalizado" }));
    await user.type(screen.getByLabelText("Data inicial"), "2026-09-01");
    await user.type(screen.getByLabelText("Data final"), "2026-09-30");

    await waitFor(() =>
      expect(
        chamadas.some((c) => c.get("inicio") === "2026-09-01" && c.get("fim") === "2026-09-30"),
      ).toBe(true),
    );
  });

  it("falha da API mostra estado de erro, nunca indicadores zerados", async () => {
    server.use(serverError(ROTA));
    renderizar();

    expect(await screen.findByTestId("error-state")).toBeInTheDocument();
    expect(screen.queryByText("Receita confirmada")).not.toBeInTheDocument();
  });

  it("período sem movimento mostra os estados vazios dos gráficos", async () => {
    const vazio: RelatorioAdministrativo = {
      ...relatorioAdministrativoFixture,
      resumoFinanceiro: {
        receitaConfirmada: 0,
        ingressosPagos: 0,
        receitaSemDataPagamento: 0,
        ingressosSemDataPagamento: 0,
        ingressosEmitidos: 0,
        ingressosEmitidosConfirmados: 0,
        ingressosPendentes: 0,
        ingressosCancelados: 0,
        checkIns: 0,
        ingressosElegiveisCheckIn: 0,
        taxaComparecimento: 0,
      },
      vendasPorDia: [],
      campeonatosPorEsporte: [],
    };
    server.use(okJson(ROTA, vazio));
    renderizar();

    expect(await screen.findByText("Nenhum pagamento confirmado no período.")).toBeInTheDocument();
    expect(screen.getByText("Nenhum ingresso emitido no período.")).toBeInTheDocument();
    expect(
      screen.getByText("sem ingressos confirmados de partidas já iniciadas"),
    ).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByTestId("error-state")).not.toBeInTheDocument();
  });

  it("mostra a situação dos ingressos com rótulos e percentuais", async () => {
    renderizar();

    const lista = await screen.findByRole("list");
    expect(within(lista).getByText("Confirmados")).toBeInTheDocument();
    expect(within(lista).getByText("Pendentes")).toBeInTheDocument();
    expect(within(lista).getByText("Cancelados")).toBeInTheDocument();
    expect(screen.getByText("Situação dos ingressos emitidos no período")).toBeInTheDocument();
  });

  it("identifica os indicadores que são situação atual e explica o comparecimento", async () => {
    renderizar();
    await screen.findByText(/1\.250,50/);

    expect(screen.getAllByText("Situação atual")).toHaveLength(2);
    expect(screen.getByText("20 de 25 · partidas já iniciadas")).toBeInTheDocument();
    expect(
      screen.getByText(/Campeonatos cadastrados em cada esporte · situação atual/),
    ).toBeInTheDocument();
  });

  it("avisa quando há receita confirmada sem data de pagamento", async () => {
    server.use(
      okJson(ROTA, {
        ...relatorioAdministrativoFixture,
        inicio: "2026-09-06T00:00:00",
        fim: "2026-10-05T00:00:00",
        resumoFinanceiro: {
          ...relatorioAdministrativoFixture.resumoFinanceiro,
          receitaSemDataPagamento: 270,
          ingressosSemDataPagamento: 6,
        },
      }),
    );
    renderizar();

    expect(await screen.findByRole("note")).toHaveTextContent(
      /6 ingressos.*ficam fora deste período/,
    );
  });

  it("não exporta dados de outro recorte quando a consulta do filtro atual falha", async () => {
    const user = userEvent.setup();
    renderizar();
    await screen.findByText(/1\.250,50/);
    expect(screen.getByRole("button", { name: /Exportar CSV/i })).toBeEnabled();

    server.use(serverError(ROTA));
    await user.click(screen.getByRole("button", { name: "Tudo" }));

    expect(await screen.findByTestId("error-state")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exportar CSV/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Exportar PDF/i })).toBeDisabled();
  });

  it("exporta CSV do recorte atual", async () => {
    const criarUrl = vi.fn<(blob: Blob) => string>(() => "blob:relatorio");
    Object.assign(URL, { createObjectURL: criarUrl, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const user = userEvent.setup();
    renderizar();
    await screen.findByText(/1\.250,50/);

    await user.click(screen.getByRole("button", { name: /Exportar CSV/i }));

    expect(criarUrl).toHaveBeenCalledTimes(1);
    const blob = criarUrl.mock.calls[0][0];
    expect(blob.type).toContain("text/csv");
    // Mesmo recorte e mesmos indicadores da tela.
    const csv = await blob.text();
    expect(csv).toMatch(/Período;\d{2}\/\d{2}\/\d{4} a \d{2}\/\d{2}\/\d{4}/);
    expect(csv).toContain("Esporte;Todos os esportes");
    for (const indicador of montarIndicadores(relatorioAdministrativoFixture)) {
      expect(csv).toContain(`${indicador.rotulo};${indicador.valor}`);
    }
  });
});
