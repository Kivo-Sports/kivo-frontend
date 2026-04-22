import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import type { AuthState } from "../slices/authSlice";

interface RootStateForApi {
  auth: AuthState;
}

export const baseApi = createApi({
  reducerPath: "baseApi",
  tagTypes: ["Time", "Campeonato"],
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const tokenDoUsuarioLogado = (getState() as RootStateForApi).auth.token;

      if (tokenDoUsuarioLogado) {
        headers.set("Authorization", `Bearer ${tokenDoUsuarioLogado}`);
      }

      return headers;
    },
  }),
  endpoints: () => ({}),
});
