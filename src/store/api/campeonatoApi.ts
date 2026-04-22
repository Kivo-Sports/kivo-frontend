import { baseApi } from "@/store/api/baseApi";
import type { CriarCampeonatoRequest, CampeonatoResponse } from "@/types/campeonato";

export const campeonatoApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    criarCampeonato: builder.mutation<CampeonatoResponse, CriarCampeonatoRequest>({
      query: (body) => ({
        url: "/api/campeonato",
        method: "POST",
        body: {
          organizadorCampeonatoId: body.organizadorCampeonatoId,
          nome: body.nome,
          dataInicio: body.dataInicio,
          dataFim: body.dataFim,
          pontosVitoria: body.pontosVitoria,
          pontosDerrota: body.pontosDerrota,
          pontosEmpate: body.pontosEmpate,
        },
      }),
      invalidatesTags: ["Campeonato"],
    }),
    listarCampeonatos: builder.query<CampeonatoResponse[], void>({
      query: () => ({
        url: "/api/campeonato",
        method: "GET",
      }),
      providesTags: ["Campeonato"],
    }),
  }),
});

export const { useCriarCampeonatoMutation, useListarCampeonatosQuery } = campeonatoApi;
