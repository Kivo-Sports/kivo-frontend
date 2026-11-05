import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

import type { AuthState } from "../slices/authSlice";
import { clearCredentials } from "../slices/authSlice";

interface RootStateForApi {
  auth: AuthState;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const tokenDoUsuarioLogado = (getState() as RootStateForApi).auth.token;

    if (tokenDoUsuarioLogado) {
      headers.set("Authorization", `Bearer ${tokenDoUsuarioLogado}`);
    }

    return headers;
  },
});

const baseQueryWithAutoLogout: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const token = (api.getState() as RootStateForApi).auth.token;
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && token === (api.getState() as RootStateForApi).auth.token) {
    api.dispatch(clearCredentials());
    api.dispatch(baseApi.util.resetApiState());
    if (typeof window !== "undefined") window.dispatchEvent(new Event("kivo:session-invalid"));
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  tagTypes: [
    "Time",
    "Campeonato",
    "Partida",
    "Esporte",
    "Organizador",
    "Favorito",
    "Ingresso",
    "Notificacao",
    "Post",
    "TipoDeficiencia",
  ],
  baseQuery: baseQueryWithAutoLogout,
  endpoints: () => ({}),
});
