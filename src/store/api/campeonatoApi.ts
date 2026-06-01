import { baseApi } from "@/store/api/baseApi";
import type {
  CriarCampeonatoRequest,
  EditarCampeonatoRequest,
  CampeonatoResponse,
  ConviteRequest,
  ResponderConviteRequest,
  ConvitePendenteResponse,
  ConviteCampeonatoResponse,
} from "@/types/campeonato";
import type { TimeResponse } from "@/types/time";

function buildCampeonatoFormData(body: {
  organizadorCampeonatoId?: string;
  esporteId?: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  pontosVitoria: number;
  pontosDerrota: number;
  pontosEmpate: number;
  formatoCampeonato: number;
  quantidadeTimesClassificam: number;
  logo?: File;
}): FormData {
  const formData = new FormData();

  if (body.organizadorCampeonatoId) {
    formData.append("OrganizadorCampeonatoId", body.organizadorCampeonatoId);
  }

  if (body.esporteId) {
    formData.append("EsporteId", body.esporteId);
  }

  formData.append("Nome", body.nome);
  formData.append("DataInicio", body.dataInicio);
  formData.append("DataFim", body.dataFim);
  formData.append("PontosVitoria", String(body.pontosVitoria));
  formData.append("PontosDerrota", String(body.pontosDerrota));
  formData.append("PontosEmpate", String(body.pontosEmpate));
  formData.append("FormatoCampeonato", String(body.formatoCampeonato));
  formData.append("QuantidadeTimesClassificam", String(body.quantidadeTimesClassificam));

  if (body.logo) {
    formData.append("logo", body.logo);
  }

  return formData;
}

export const campeonatoApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    criarCampeonato: builder.mutation<CampeonatoResponse, CriarCampeonatoRequest>({
      query: (body) => ({
        url: "/api/campeonato",
        method: "POST",
        body: buildCampeonatoFormData(body),
      }),
      invalidatesTags: ["Campeonato"],
    }),
    editarCampeonato: builder.mutation<CampeonatoResponse, EditarCampeonatoRequest>({
      query: ({ id, ...body }) => ({
        url: `/api/campeonato/${id}`,
        method: "PUT",
        body: buildCampeonatoFormData(body),
      }),
      invalidatesTags: ["Campeonato"],
    }),
    listarCampeonatos: builder.query<CampeonatoResponse[], void>({
      query: () => ({ url: "/api/campeonato", method: "GET" }),
      providesTags: ["Campeonato"],
    }),
    obterCampeonatoPorId: builder.query<CampeonatoResponse, string>({
      query: (id) => ({ url: `/api/campeonato/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Campeonato", id }],
    }),
    abrirInscricoes: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/campeonato/${id}/abrir-inscricoes`, method: "PATCH" }),
      invalidatesTags: ["Campeonato"],
    }),
    iniciarCampeonato: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/campeonato/${id}/iniciar-campeonato`, method: "PATCH" }),
      invalidatesTags: ["Campeonato"],
    }),
    cancelarCampeonato: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/campeonato/${id}/cancelar`, method: "PATCH" }),
      invalidatesTags: ["Campeonato"],
    }),
    removerTimeDoCampeonato: builder.mutation<void, { campeonatoId: string; timeId: string }>({
      query: (body) => ({
        url: "/api/campeonato/remover-time",
        method: "DELETE",
        body: { campeonatoId: body.campeonatoId, timeId: body.timeId },
      }),
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
    responderConvite: builder.mutation<void, { participacaoId: string; body: ResponderConviteRequest }>({
      query: ({ participacaoId, body }) => ({
        url: `/api/campeonato/responder-convite/${participacaoId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Campeonato"],
    }),
    listarConvitesCampeonato: builder.query<ConviteCampeonatoResponse[], string>({
      query: (campeonatoId) => ({ url: `/api/campeonato/${campeonatoId}/convites`, method: "GET" }),
      providesTags: ["Campeonato"],
    }),
  }),
});

export const {
  useCriarCampeonatoMutation,
  useEditarCampeonatoMutation,
  useListarCampeonatosQuery,
  useObterCampeonatoPorIdQuery,
  useAbrirInscricoesMutation,
  useIniciarCampeonatoMutation,
  useCancelarCampeonatoMutation,
  useRemoverTimeDoCampeonatoMutation,
  useConvidarTimeMutation,
  useListarTodosOsTimesQuery,
  useListarConvitesPendentesQuery,
  useResponderConviteMutation,
  useListarConvitesCampeonatoQuery,
} = campeonatoApi;
