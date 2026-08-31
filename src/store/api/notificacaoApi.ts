import { baseApi } from "@/store/api/baseApi";
import type { Notificacao, QuantidadeNaoLidasResponse } from "@/types/notificacao";

export const notificacaoApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    listarMinhasNotificacoes: builder.query<Notificacao[], void>({
      query: () => ({ url: "/api/Notificacao", method: "GET" }),
      providesTags: [{ type: "Notificacao", id: "LIST" }],
    }),
    obterQuantidadeNaoLidas: builder.query<QuantidadeNaoLidasResponse, void>({
      query: () => ({ url: "/api/Notificacao/contador-nao-lidas", method: "GET" }),
      providesTags: [{ type: "Notificacao", id: "COUNT" }],
    }),
    marcarNotificacaoComoLida: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/Notificacao/${id}/ler`, method: "PUT" }),
      invalidatesTags: [
        { type: "Notificacao", id: "LIST" },
        { type: "Notificacao", id: "COUNT" },
      ],
    }),
    marcarTodasNotificacoesComoLidas: builder.mutation<void, void>({
      query: () => ({ url: "/api/Notificacao/ler-todas", method: "PUT" }),
      invalidatesTags: [
        { type: "Notificacao", id: "LIST" },
        { type: "Notificacao", id: "COUNT" },
      ],
    }),
  }),
});

export const {
  useListarMinhasNotificacoesQuery,
  useObterQuantidadeNaoLidasQuery,
  useMarcarNotificacaoComoLidaMutation,
  useMarcarTodasNotificacoesComoLidasMutation,
} = notificacaoApi;
