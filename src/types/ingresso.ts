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

export interface ItemCompraIngresso {
  ingressoLoteId: string;
  quantidade: number;
}

export interface ComprarIngressosRequest {
  itens: ItemCompraIngresso[];
}

export interface IngressoDetalhes {
  id: string;
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
  nomeTitular: string;
  cpfTitular: string;
}

export interface CompraIngressosResponse {
  asaasPaymentId: string;
  valorTotal: number;
  pixCopiaCola: string;
  qrCodeBase64: string;
  ingressos: IngressoDetalhes[];
}

export interface AtribuirTitularIngressoRequest {
  ingressoId: string;
  nome: string;
  cpf: string;
}

export interface MensagemResponse {
  message: string;
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
