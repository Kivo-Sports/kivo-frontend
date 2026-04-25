import { baseApi } from "@/store/api/baseApi";
import type {
  CriarCampeonatoRequest,
  CampeonatoResponse,
  ConviteRequest,
  ResponderConviteRequest,
  ConvitePendenteResponse,
  ParticipacaoResponse,
} from "@/types/campeonato";
import type { TimeResponse } from "@/types/time";

export const campeonatoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    criarCampeonato: builder.mutation<CampeonatoResponse, CriarCampeonatoRequest>({
      query: (body) => ({
        url: "/api/campeonato",
        method: "POST",
        body: {
          organizadorCampeonatoId: body.organizadorCampeonatoId,
          nome: body.nome,
          dataInicio: body.dataInicio,
          dataFim: body.dataFim,
          pontosVitoria: body.pontosVitoria,
          pontosDerrota: body.pontosDerrota,
          pontosEmpate: body.pontosEmpate,
        },
      }),
      invalidatesTags: ["Campeonato"],
    }),
    listarCampeonatos: builder.query<CampeonatoResponse[], void>({
      query: () => ({ url: "/api/campeonato", method: "GET" }),
      providesTags: ["Campeonato"],
    }),
    abrirInscricoes: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/campeonato/${id}/abrir-inscricoes`, method: "PATCH" }),
      invalidatesTags: ["Campeonato"],
    }),
    cancelarCampeonato: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/campeonato/${id}/cancelar`, method: "PATCH" }),
      invalidatesTags: ["Campeonato"],
    }),
    convidarTime: builder.mutation<void, ConviteRequest>({
      query: (body) => ({
        url: "/api/campeonato/convidar-time",
        method: "POST",
        body: { campeonatoId: body.campeonatoId, timeId: body.timeId },
      }),
      invalidatesTags: ["Campeonato"],
    }),
    listarTodosOsTimes: builder.query<TimeResponse[], void>({
      query: () => ({ url: "/api/time", method: "GET" }),
      providesTags: ["Time"],
    }),
    listarConvitesPendentes: builder.query<ConvitePendenteResponse[], string>({
      query: (organizadorTimeId) => ({
        url: `/api/campeonato/convites-pendentes/${organizadorTimeId}`,
        method: "GET",
      }),
      providesTags: ["Campeonato"],
    }),
    listarParticipacoesCampeonato: builder.query<ParticipacaoResponse[], string>({
      query: (campeonatoId) => ({
        url: `/api/campeonato/${campeonatoId}/participacoes`,
        method: "GET",
      }),
      providesTags: ["Campeonato"],
    }),
    responderConvite: builder.mutation<void, { participacaoId: string; body: ResponderConviteRequest }>({
      query: ({ participacaoId, body }) => ({
        url: `/api/campeonato/responder-convite/${participacaoId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Campeonato"],
    }),
  }),
});

export const {
  useCriarCampeonatoMutation,
  useListarCampeonatosQuery,
  useAbrirInscricoesMutation,
  useCancelarCampeonatoMutation,
  useConvidarTimeMutation,
  useListarTodosOsTimesQuery,
  useListarConvitesPendentesQuery,
  useListarParticipacoesCampeonatoQuery,
  useResponderConviteMutation,
} = campeonatoApi;
