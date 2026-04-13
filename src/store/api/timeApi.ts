import { baseApi } from "@/store/api/baseApi";
import type { CriarTimeRequest, TimeResponse } from "@/types/time";

export const timeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    criarTime: builder.mutation<TimeResponse, CriarTimeRequest>({
      query: (body) => ({
        url: "/api/times",
        method: "POST",
        body: {
          nome: body.nome,
          cidade: body.cidade,
          estado: body.estado,
          ...(body.logoUrl ? { logoUrl: body.logoUrl } : {}),
        },
      }),
      invalidatesTags: ["Time"],
    }),
    listarTimesOrganizador: builder.query<TimeResponse[], void>({
      query: () => ({
        url: "/api/times",
        method: "GET",
      }),
      providesTags: ["Time"],
    }),
  }),
});

export const { useCriarTimeMutation, useListarTimesOrganizadorQuery } = timeApi;
