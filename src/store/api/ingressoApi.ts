import { baseApi } from "@/store/api/baseApi";
import type {
  AtribuirTitularIngressoRequest,
  ComprarIngressosRequest,
  CompraIngressosResponse,
  CriarIngressoLoteRequest,
  IngressoDetalhes,
  IngressoLote,
  MensagemResponse,
  PartidaComIngressos,
} from "@/types/ingresso";
import type { CampeonatoResponse } from "@/types/campeonato";
import type { ChaveamentoResponse, DetalhePartidaResponse, JogoResponse } from "@/types/partida";

export const ingressoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    obterLotesPorPartida: builder.query<IngressoLote[], string>({
      query: (partidaId) => `/api/ingressolote/partida/${partidaId}/lotes`,
      providesTags: (_result, _error, partidaId) => [
        { type: "Ingresso", id: `LOTES-${partidaId}` },
      ],
    }),
    obterPartidasComIngressos: builder.query<PartidaComIngressos[], void>({
      async queryFn(_arg, _api, _extraOptions, fetchWithBQ) {
        const campeonatosResult = await fetchWithBQ("/api/campeonato");
        if (campeonatosResult.error) return { error: campeonatosResult.error };
        const campeonatos = campeonatosResult.data as CampeonatoResponse[];
        const candidatos: Array<{ id: string; campeonatoId: string }> = [];

        const resultados = await Promise.all(
          campeonatos.map(async (campeonato) => {
            const requests: Array<ReturnType<typeof fetchWithBQ>> = [];
            if (
              campeonato.formatoCampeonato === "PontosCorridos" ||
              campeonato.formatoCampeonato === "Hibrido"
            )
              requests.push(fetchWithBQ(`/api/partida/jogos/${campeonato.id}`));
            if (
              campeonato.formatoCampeonato === "MataMata" ||
              campeonato.formatoCampeonato === "Hibrido"
            )
              requests.push(fetchWithBQ(`/api/partida/chaveamento/${campeonato.id}`));
            return { campeonato, respostas: await Promise.all(requests) };
          }),
        );

        resultados.forEach(({ campeonato, respostas }) =>
          respostas.forEach((resposta) => {
            if (resposta.error || !Array.isArray(resposta.data)) return;
            (resposta.data as Array<JogoResponse | ChaveamentoResponse>).forEach((item) => {
              if ("partidas" in item)
                item.partidas.forEach((partida) =>
                  candidatos.push({ id: partida.id, campeonatoId: campeonato.id }),
                );
              else candidatos.push({ id: item.id, campeonatoId: campeonato.id });
            });
          }),
        );

        const itens = await Promise.all(
          [...new Map(candidatos.map((item) => [item.id, item])).values()].map(async (item) => {
            const [partidaResult, lotesResult] = await Promise.all([
              fetchWithBQ(`/api/partida/${item.id}`),
              fetchWithBQ(`/api/ingressolote/partida/${item.id}/lotes`),
            ]);
            if (partidaResult.error || lotesResult.error) return null;
            const partida = partidaResult.data as DetalhePartidaResponse;
            const lotes = (lotesResult.data as IngressoLote[]).filter(
              (lote) => lote.ativo && lote.quantidadeDisponivel > 0,
            );
            if (partida.finalizado || lotes.length === 0) return null;
            return {
              partidaId: partida.id,
              campeonatoId: item.campeonatoId,
              nomeTimeCasa: partida.nomeTimeCasa,
              logoTimeCasa: partida.logoTimeCasa,
              nomeTimeVisitante: partida.nomeTimeVisitante,
              logoTimeVisitante: partida.logoTimeVisitante,
              dataHora: partida.dataHora,
              local: partida.local || "Local a definir",
              precoInicial: Math.min(...lotes.map((lote) => lote.preco)),
              quantidadeDisponivel: lotes.reduce(
                (total, lote) => total + lote.quantidadeDisponivel,
                0,
              ),
              quantidadeLotes: lotes.length,
            } satisfies PartidaComIngressos;
          }),
        );
        return { data: itens.filter((item): item is PartidaComIngressos => item !== null) };
      },
      providesTags: [{ type: "Ingresso", id: "PARTIDAS-DISPONIVEIS" }],
    }),
    criarLoteIngresso: builder.mutation<IngressoLote, CriarIngressoLoteRequest>({
      query: (body) => ({ url: "/api/ingressolote/lote", method: "POST", body }),
      invalidatesTags: (_result, _error, body) => [
        { type: "Ingresso", id: `LOTES-${body.partidaId}` },
        { type: "Ingresso", id: "PARTIDAS-DISPONIVEIS" },
      ],
    }),
    comprarIngressos: builder.mutation<CompraIngressosResponse, ComprarIngressosRequest>({
      query: (body) => ({ url: "/api/ingresso/comprar", method: "POST", body }),
      invalidatesTags: [{ type: "Ingresso", id: "MEUS-INGRESSOS" }],
    }),
    obterMeusIngressos: builder.query<IngressoDetalhes[], void>({
      query: () => ({ url: "/api/ingresso/meus-ingressos", method: "GET" }),
      providesTags: (result) => [
        { type: "Ingresso", id: "MEUS-INGRESSOS" },
        ...(result ?? []).map((ingresso) => ({
          type: "Ingresso" as const,
          id: ingresso.id,
        })),
      ],
    }),
    validarIngressoPortaria: builder.mutation<MensagemResponse, string>({
      query: (codigo) => ({
        url: `/api/ingresso/validar-portaria/${encodeURIComponent(codigo)}`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Ingresso", id: "MEUS-INGRESSOS" }],
    }),
    confirmarPagamentoIngresso: builder.mutation<MensagemResponse, string>({
      query: (ingressoId) => ({
        url: `/api/ingresso/pagar/${ingressoId}`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Ingresso", id: "MEUS-INGRESSOS" }],
    }),
    atribuirTitularIngresso: builder.mutation<MensagemResponse, AtribuirTitularIngressoRequest>({
      query: ({ ingressoId, ...body }) => ({
        url: `/api/ingresso/${ingressoId}/titular`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { ingressoId }) => [
        { type: "Ingresso", id: "MEUS-INGRESSOS" },
        { type: "Ingresso", id: ingressoId },
      ],
    }),
  }),
});

export const {
  useObterLotesPorPartidaQuery,
  useObterPartidasComIngressosQuery,
  useCriarLoteIngressoMutation,
  useComprarIngressosMutation,
  useObterMeusIngressosQuery,
  useLazyObterMeusIngressosQuery,
  useValidarIngressoPortariaMutation,
  useConfirmarPagamentoIngressoMutation,
  useAtribuirTitularIngressoMutation,
} = ingressoApi;
