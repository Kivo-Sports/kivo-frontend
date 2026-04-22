import { baseApi } from "@/store/api/baseApi";

export interface PerfilUsuarioResponse {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  cargo: string;
  organizadorCampeonatoId?: string;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPerfilUsuario: builder.query<PerfilUsuarioResponse, string>({
      query: (id) => ({
        url: `/api/Usuario/${id}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useGetPerfilUsuarioQuery } = userApi;
