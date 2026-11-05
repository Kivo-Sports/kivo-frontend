import { baseApi } from "@/store/api/baseApi";
import type { TipoDeficiencia } from "@/types/ingresso";

export const tipoDeficienciaApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listarTiposDeficiencia: builder.query<TipoDeficiencia[], void>({
      query: () => ({ url: "/api/tipodeficiencia", method: "GET" }),
      providesTags: ["TipoDeficiencia"],
    }),
  }),
});

export const { useListarTiposDeficienciaQuery } = tipoDeficienciaApi;
