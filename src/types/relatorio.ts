/**
 * @file relatorio.ts
 * @description Contratos dos relatórios agregados (`/api/relatorios/*`).
 * Espelham os DTOs de `RelatorioDTOs.cs` no backend (serialização camelCase).
 */

/** Filtro do relatório administrativo. Datas no formato `YYYY-MM-DD`. */
export interface FiltroRelatorioAdministrativo {
  inicio?: string;
  fim?: string;
  esporteId?: string;
}

export interface SerieVendas {
  /** ISO vindo do backend; o dia é sempre os 10 primeiros caracteres (agrupado em UTC). */
  data: string;
  quantidade: number;
  receita: number;
}

export interface ItemQuantidade {
  nome: string;
  quantidade: number;
}

/**
 * Períodos são dias inclusivos em America/Sao_Paulo (regras em `ResumoFinanceiroDTO` no backend).
 */
export interface ResumoFinanceiro {
  /** Confirmados (pagos/utilizados) pela data do pagamento. Sem filtro de data, inclui os sem data de pagamento. */
  receitaConfirmada: number;
  ingressosPagos: number;
  /** Confirmados sem data de pagamento registrada (anteriores à coluna); nunca atribuídos a um dia. */
  receitaSemDataPagamento: number;
  ingressosSemDataPagamento: number;
  /** Emitidos (data da compra) no período, pela situação atual. */
  ingressosEmitidos: number;
  ingressosEmitidosConfirmados: number;
  ingressosPendentes: number;
  ingressosCancelados: number;
  /** Check-ins entre os confirmados de partidas elegíveis (finalizadas ou já iniciadas) com data no período. */
  checkIns: number;
  ingressosElegiveisCheckIn: number;
  /** Percentual 0–100 de check-ins sobre `ingressosElegiveisCheckIn`. */
  taxaComparecimento: number;
}

export interface RelatorioAdministrativo {
  inicio: string | null;
  fim: string | null;
  esporteId: string | null;
  usuariosTotais: number;
  novosUsuarios: number;
  campeonatosTotais: number;
  campeonatosEmAndamento: number;
  partidasRealizadas: number;
  timesAtivos: number;
  resumoFinanceiro: ResumoFinanceiro;
  vendasPorDia: SerieVendas[];
  usuariosPorPerfil: ItemQuantidade[];
  campeonatosPorEsporte: ItemQuantidade[];
}
