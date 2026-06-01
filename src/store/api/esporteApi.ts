import { baseApi } from "@/store/api/baseApi";
import type {
  EsporteResponse,
  CriarEsporteRequest,
  EditarEsporteRequest,
} from "@/types/esporte";

export const esporteApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    listarEsportes: builder.query<EsporteResponse[], void>({
      query: () => ({ url: "/api/esporte", method: "GET" }),
      providesTags: ["Esporte"],
    }),
    obterEsportePorId: builder.query<EsporteResponse, string>({
      query: (id) => ({ url: `/api/esporte/${id}`, method: "GET" }),
      providesTags: (_result, _error, id) => [{ type: "Esporte", id }],
    }),
    criarEsporte: builder.mutation<EsporteResponse, CriarEsporteRequest>({
      query: (body) => ({ url: "/api/esporte", method: "POST", body }),
      invalidatesTags: ["Esporte"],
    }),
    editarEsporte: builder.mutation<EsporteResponse, EditarEsporteRequest>({
      query: ({ id, ...body }) => ({ url: `/api/esporte/${id}`, method: "PUT", body }),
      invalidatesTags: (_result, _error, { id }) => ["Esporte", { type: "Esporte", id }],
    }),
    toggleStatusEsporte: builder.mutation<EsporteResponse, string>({
      query: (id) => ({ url: `/api/esporte/${id}/status`, method: "PATCH" }),
      invalidatesTags: (_result, _error, id) => ["Esporte", { type: "Esporte", id }],
    }),
    removerEsporte: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/esporte/${id}`, method: "DELETE" }),
      invalidatesTags: ["Esporte"],
    }),
  }),
});

export const {
  useListarEsportesQuery,
  useObterEsportePorIdQuery,
  useCriarEsporteMutation,
  useEditarEsporteMutation,
  useToggleStatusEsporteMutation,
  useRemoverEsporteMutation,
} = esporteApi;
