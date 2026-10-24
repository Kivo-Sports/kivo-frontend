import { baseApi } from "@/store/api/baseApi";
import type { OrganizadorOption } from "@/types/admin";

export const adminApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    listarOrganizadoresCampeonato: builder.query<OrganizadorOption[], void>({
      query: () => ({ url: "/api/usuario/organizadores-campeonato", method: "GET" }),
      providesTags: ["Organizador"],
    }),
    listarOrganizadoresTime: builder.query<OrganizadorOption[], void>({
      query: () => ({ url: "/api/usuario/organizadores-time", method: "GET" }),
      providesTags: ["Organizador"],
    }),
  }),
});

export const {
  useListarOrganizadoresCampeonatoQuery,
  useListarOrganizadoresTimeQuery,
} = adminApi;
