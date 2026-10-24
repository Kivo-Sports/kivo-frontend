import { baseApi } from "@/store/api/baseApi";
import type { FiltroRelatorioAdministrativo, RelatorioAdministrativo } from "@/types/relatorio";

export const relatorioApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    obterRelatorioAdministrativo: builder.query<
      RelatorioAdministrativo,
      FiltroRelatorioAdministrativo
    >({
      query: ({ inicio, fim, esporteId }) => ({
        url: "/api/relatorios/administrativo",
        method: "GET",
        // fetchBaseQuery descarta chaves undefined, então só os filtros ativos vão na URL.
        params: { inicio, fim, esporteId },
      }),
    }),
  }),
});

export const { useObterRelatorioAdministrativoQuery } = relatorioApi;
