import { baseApi } from "@/store/api/baseApi";
import type {
  TabelaClassificacaoResponse,
  ChaveamentoResponse,
  JogoResponse,
  DetalhePartidaResponse,
  AtualizarPlacarRequest,
  AgendarPartidaRequest,
} from "@/types/partida";

export const partidaApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    gerarTabela: builder.mutation<void, string>({
      query: (campeonatoId) => ({
        url: `/api/partida/gerar-tabela/${campeonatoId}`,
        method: "POST",
      }),
      invalidatesTags: ["Partida"],
    }),
    atualizarPlacar: builder.mutation<void, AtualizarPlacarRequest>({
      query: ({ partidaId, golsTimeCasa, golsTimeVisitante }) => ({
        url: `/api/partida/${partidaId}/atualizar-placar`,
        method: "PATCH",
        body: { golsTimeCasa, golsTimeVisitante },
      }),
      invalidatesTags: ["Partida"],
    }),
    agendarPartida: builder.mutation<void, AgendarPartidaRequest>({
      query: ({ partidaId, dataHora, local }) => ({
        url: `/api/partida/${partidaId}/agendar`,
        method: "PATCH",
        body: { dataHora, local },
      }),
      invalidatesTags: ["Partida"],
    }),
    obterPartida: builder.query<DetalhePartidaResponse, string>({
      query: (partidaId) => ({ url: `/api/partida/${partidaId}`, method: "GET" }),
      providesTags: ["Partida"],
    }),
    obterClassificacao: builder.query<TabelaClassificacaoResponse[], string>({
      query: (campeonatoId) => ({ url: `/api/partida/tabela/${campeonatoId}`, method: "GET" }),
      providesTags: ["Partida"],
    }),
    obterChaveamento: builder.query<ChaveamentoResponse[], string>({
      query: (campeonatoId) => ({ url: `/api/partida/chaveamento/${campeonatoId}`, method: "GET" }),
      providesTags: ["Partida"],
    }),
    // Endpoint pendente no backend — ver kivo-backend/PENDENCIAS-BACKEND.md
    listarJogos: builder.query<JogoResponse[], string>({
      query: (campeonatoId) => ({ url: `/api/partida/jogos/${campeonatoId}`, method: "GET" }),
      providesTags: ["Partida"],
    }),
  }),
});

export const {
  useGerarTabelaMutation,
  useAtualizarPlacarMutation,
  useAgendarPartidaMutation,
  useObterPartidaQuery,
  useObterClassificacaoQuery,
  useObterChaveamentoQuery,
  useListarJogosQuery,
} = partidaApi;
