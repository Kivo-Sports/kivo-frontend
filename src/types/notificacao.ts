export enum EnumTipoNotificacao {
  Sistema = 0,
  IngressoConfirmado = 1,
  IngressoUtilizado = 2,
  PartidaProxima = 3,
  CampeonatoFase = 4,
  TimeInscrito = 5,
}

export interface Notificacao {
  id: string;
  usuarioId: string;
  usuario?: unknown | null;
  titulo: string;
  mensagem: string;
  linkRedirecionamento: string | null;
  tipo: EnumTipoNotificacao;
  lida: boolean;
  criadaEm: string;
}

export interface QuantidadeNaoLidasResponse {
  naoLidas: number;
}
