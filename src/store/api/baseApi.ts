/**
 * @file baseApi.ts
 * @description Configuracao base do RTK Query para chamadas HTTP no Kivo.
 *
 * Aqui eu centralizei baseUrl + Authorization header para nao repetir
 * essa mesma configuracao em cada endpoint novo.
 *
 * Eu cheguei a testar axios com interceptors, mas para o TCC o RTK Query
 * ficou mais consistente com o Redux que ja estamos usando no projeto.
 *
 * @author Kivo Sports - TCC
 */

// - Redux Toolkit / RTK Query
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// - Tipos locais
import type { AuthState } from "../slices/authSlice";

interface RootStateForApi {
  auth: AuthState;
}

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: fetchBaseQuery({
    // por enquanto a URL vem do .env.local para facilitar troca de ambiente
    // TODO: diferenciar melhor ambiente local/staging/producao sem editar .env na mao
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      // 1) pega o estado global atual
      // 2) le o token salvo no authSlice
      // 3) se existir, injeta Authorization em todas as requests
      const tokenDoUsuarioLogado = (getState() as RootStateForApi).auth.token;

      if (tokenDoUsuarioLogado) {
        headers.set("Authorization", `Bearer ${tokenDoUsuarioLogado}`);
      }

      // FIXME: quando tiver refresh token, revisar aqui para evitar token expirado em loop
      return headers;
    },
  }),
  endpoints: () => ({}),
});
