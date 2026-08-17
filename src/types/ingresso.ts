export enum StatusIngresso {
  Pendente = 0,
  Pago = 1,
  Cancelado = 2,
  Utilizado = 3,
}

export interface IngressoLote {
  id: string;
  partidaId: string;
  nomeLote: string;
  preco: number;
  quantidadeTotal: number;
  quantidadeDisponivel: number;
  ativo: boolean;
}

export interface CriarIngressoLoteRequest {
  partidaId: string;
  nomeLote: string;
  preco: number;
  quantidadeTotal: number;
  ativo: boolean;
}

export interface IngressoDetalhes {
  id: string;
  usuarioId: string;
  nomeLote: string;
  nomePartida: string;
  dataPartida: string;
  localPartida: string;
  precoPago: number;
  dataCompra: string;
  status: StatusIngresso;
  codigoValidacao: string;
  qrCodeBase64: string;
  pixCopiaCola: string;
}

export interface PartidaComIngressos {
  partidaId: string;
  campeonatoId: string;
  nomeTimeCasa: string;
  logoTimeCasa: string | null;
  nomeTimeVisitante: string;
  logoTimeVisitante: string | null;
  dataHora: string | null;
  local: string;
  precoInicial: number;
  quantidadeDisponivel: number;
  quantidadeLotes: number;
}
