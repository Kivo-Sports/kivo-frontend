import { baseApi } from "./baseApi";
import type { Post, PostInput } from "@/types/post";

export function buildPostFormData(input: PostInput) {
  const body = new FormData();
  body.append("Titulo", input.titulo.trim());
  body.append("Conteudo", input.conteudo.trim());
  if (input.tipoAutorExibicao !== undefined)
    body.append("TipoAutorExibicao", String(input.tipoAutorExibicao));
  if (input.entidadeAutorId) body.append("EntidadeAutorId", input.entidadeAutorId);
  body.append("RemoverImagem", String(input.removerImagem ?? false));
  if (input.imagem) body.append("imagem", input.imagem);
  return body;
}
export const postApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listarPosts: builder.query<Post[], void>({ query: () => "/api/Post", providesTags: ["Post"] }),
    obterPost: builder.query<Post, string>({
      query: (id) => `/api/Post/${id}`,
      providesTags: ["Post"],
    }),
    criarPost: builder.mutation<Post, PostInput>({
      query: (input) => ({ url: "/api/Post", method: "POST", body: buildPostFormData(input) }),
      invalidatesTags: ["Post"],
    }),
    editarPost: builder.mutation<Post, { id: string; input: PostInput }>({
      query: ({ id, input }) => ({
        url: `/api/Post/${id}`,
        method: "PUT",
        body: buildPostFormData(input),
      }),
      invalidatesTags: ["Post"],
    }),
    excluirPost: builder.mutation<void, string>({
      query: (id) => ({ url: `/api/Post/${id}`, method: "DELETE" }),
      invalidatesTags: ["Post"],
    }),
  }),
});
export const {
  useListarPostsQuery,
  useObterPostQuery,
  useCriarPostMutation,
  useEditarPostMutation,
  useExcluirPostMutation,
} = postApi;
