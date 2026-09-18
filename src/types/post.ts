export type TipoAutorPost = 0 | 1 | 2;
export interface Post {
  id: string;
  autorId: string;
  autorNome: string;
  autorImagemUrl: string | null;
  tipoAutorExibicao: TipoAutorPost;
  entidadeAutorId: string | null;
  titulo: string | null;
  conteudo: string | null;
  imagemUrl: string | null;
  criadoEm: string;
  atualizadoEm: string | null;
}
export interface PostInput {
  titulo: string;
  conteudo: string;
  imagem?: File;
  removerImagem?: boolean;
  tipoAutorExibicao?: TipoAutorPost;
  entidadeAutorId?: string;
}
