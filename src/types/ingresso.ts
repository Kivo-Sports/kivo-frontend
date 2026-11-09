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
  tipoDeficienciaId: string;
  tipoDeficienciaDescricao: string;
}

export interface TipoDeficiencia {
  id: string;
  descricao: string;
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
  tipoDeficienciaId: string;
}

export interface MensagemResponse {
  message: string;
}

/** Resposta 200 de POST /api/ingresso/validar-portaria/{codigo}: entrada liberada. */
export interface ValidacaoPortariaResponse {
  message: string;
  ingressoId: string;
  nomeTitular: string;
  /** CPF com as pontas ocultas (***.456.789-**), para conferir com o documento. */
  cpfTitularMascarado: string;
  nomeLote: string;
  nomePartida: string;
  dataPartida: string | null;
  localPartida: string;
  dataUso: string;
}

/** Corpo do 409 da portaria: o ingresso já liberou uma entrada antes. */
export interface IngressoJaUtilizadoErro {
  message: string;
  nomeTitular: string;
  dataUso: string | null;
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
