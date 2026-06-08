import { baseApi } from "@/store/api/baseApi";
import type { FavoritosResponse, TimelineItem, FavoritoRequest } from "@/types/favorito";

export const favoritoApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    listarFavoritos: builder.query<FavoritosResponse, void>({
      query: () => ({ url: "/api/favorito", method: "GET" }),
      providesTags: ["Favorito"],
    }),
    obterTimelineFavoritos: builder.query<TimelineItem[], void>({
      query: () => ({ url: "/api/favorito/timeline", method: "GET" }),
      providesTags: ["Favorito"],
    }),
    favoritar: builder.mutation<void, FavoritoRequest>({
      query: (body) => ({ url: "/api/favorito", method: "POST", body }),
      invalidatesTags: ["Favorito"],
    }),
    desfavoritar: builder.mutation<void, FavoritoRequest>({
      query: (body) => ({ url: "/api/favorito", method: "DELETE", body }),
      invalidatesTags: ["Favorito"],
    }),
  }),
});

export const {
  useListarFavoritosQuery,
  useObterTimelineFavoritosQuery,
  useFavoritarMutation,
  useDesfavoritarMutation,
} = favoritoApi;
