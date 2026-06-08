import { baseApi } from "@/store/api/baseApi";
import type { CriarTimeRequest, AtualizarTimeRequest, TimeResponse } from "@/types/time";
import type { ReatribuirTimeRequest } from "@/types/admin";

function buildTimeFormData(body: {
  organizadorTimeId?: string;
  esporteId?: string;
  nome: string;
  cidade: string;
  estado: string;
  logo?: File;
}): FormData {
  const formData = new FormData();

  if (body.organizadorTimeId) {
    formData.append("OrganizadorTimeId", body.organizadorTimeId);
  }

  if (body.esporteId) {
    formData.append("EsporteId", body.esporteId);
  }

  formData.append("Nome", body.nome);
  formData.append("Cidade", body.cidade);
  formData.append("Estado", body.estado);

  if (body.logo) {
    formData.append("logo", body.logo);
  }

  return formData;
}

export const timeApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    criarTime: builder.mutation<TimeResponse, CriarTimeRequest>({
      query: (body) => ({
        url: "/api/time",
        method: "POST",
        body: buildTimeFormData(body),
      }),
      invalidatesTags: ["Time"],
    }),
    listarTimesOrganizador: builder.query<TimeResponse[], void>({
      query: () => ({ url: "/api/time/organizador", method: "GET" }),
      providesTags: ["Time"],
    }),
    obterTimePorId: builder.query<TimeResponse, string>({
      query: (id) => ({ url: `/api/time/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Time", id }],
    }),
    atualizarTime: builder.mutation<TimeResponse, AtualizarTimeRequest>({
      query: ({ id, ...body }) => ({
        url: `/api/time/${id}`,
        method: "PUT",
        body: buildTimeFormData(body),
      }),
      invalidatesTags: (_result, _error, { id }) => ["Time", { type: "Time", id }],
    }),
    toggleStatusTime: builder.mutation<TimeResponse, string>({
      query: (id) => ({ url: `/api/time/${id}/status`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => ["Time", { type: "Time", id }],
    }),
    removerTime: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/time/${id}`, method: "DELETE" }),
      invalidatesTags: ["Time"],
    }),
    // --- Admin ---
    listarTodosTimes: builder.query<TimeResponse[], void>({
      query: () => ({ url: "/api/time", method: "GET" }),
      providesTags: ["Time"],
    }),
    reatribuirTime: builder.mutation<TimeResponse, ReatribuirTimeRequest>({
      query: ({ id, novoOrganizadorTimeId }) => ({
        url: `/api/time/${id}/reatribuir`,
        method: "PATCH",
        body: { novoOrganizadorTimeId },
      }),
      invalidatesTags: (_result, _error, { id }) => ["Time", { type: "Time", id }],
    }),
  }),
});

export const {
  useCriarTimeMutation,
  useListarTimesOrganizadorQuery,
  useObterTimePorIdQuery,
  useAtualizarTimeMutation,
  useToggleStatusTimeMutation,
  useRemoverTimeMutation,
  useListarTodosTimesQuery,
  useReatribuirTimeMutation,
} = timeApi;
