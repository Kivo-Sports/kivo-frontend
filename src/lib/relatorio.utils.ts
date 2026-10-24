/**
 * @file relatorio.utils.ts
 * @description Funções puras do dashboard administrativo: períodos de filtro,
 * preenchimento de série diária, partes da situação dos ingressos e exportação CSV.
 */

import { ACCOUNT_TYPE_CONFIG } from "@/lib/account-type.utils";
import type { RelatorioAdministrativo, ResumoFinanceiro, SerieVendas } from "@/types/relatorio";

export type PeriodoPreset = "7d" | "30d" | "90d" | "12m" | "tudo";

export const PERIODO_PRESETS: { valor: PeriodoPreset; rotulo: string }[] = [
  { valor: "7d", rotulo: "7 dias" },
  { valor: "30d", rotulo: "30 dias" },
  { valor: "90d", rotulo: "90 dias" },
  { valor: "12m", rotulo: "12 meses" },
  { valor: "tudo", rotulo: "Tudo" },
];

export interface Periodo {
  inicio?: string;
  fim?: string;
}

const DIA_MS = 24 * 60 * 60 * 1000;

function formatarDiaLocal(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Converte `YYYY-MM-DD` em timestamp UTC para iterar dias sem efeito de fuso/horário de verão. */
function diaParaUtc(dia: string): number {
  const [ano, mes, d] = dia.slice(0, 10).split("-").map(Number);
  return Date.UTC(ano, mes - 1, d);
}

function utcParaDia(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/** Intervalo inclusivo (início e fim) do preset, relativo a `hoje` no horário local. */
export function calcularPeriodo(preset: PeriodoPreset, hoje: Date = new Date()): Periodo {
  if (preset === "tudo") return {};

  const fim = formatarDiaLocal(hoje);
  const inicio = new Date(hoje);
  if (preset === "12m") {
    inicio.setFullYear(inicio.getFullYear() - 1);
    inicio.setDate(inicio.getDate() + 1);
  } else {
    const dias = { "7d": 7, "30d": 30, "90d": 90 }[preset];
    inicio.setDate(inicio.getDate() - (dias - 1));
  }
  return { inicio: formatarDiaLocal(inicio), fim };
}

export interface PontoSerieDiaria {
  dia: string;
  quantidade: number;
  receita: number;
}

/**
 * O backend só devolve dias com venda. Para a linha do tempo não "pular" dias,
 * preenche com zero cada dia entre início e fim (ou entre a primeira e a última venda).
 */
export function preencherSerieDiaria(
  serie: SerieVendas[],
  inicio?: string | null,
  fim?: string | null,
): PontoSerieDiaria[] {
  const porDia = new Map(serie.map((p) => [p.data.slice(0, 10), p]));
  const diasComVenda = [...porDia.keys()].sort();

  const primeiro = inicio ? inicio.slice(0, 10) : diasComVenda[0];
  const ultimo = fim ? fim.slice(0, 10) : diasComVenda[diasComVenda.length - 1];
  if (!primeiro || !ultimo) return [];

  const pontos: PontoSerieDiaria[] = [];
  for (let t = diaParaUtc(primeiro); t <= diaParaUtc(ultimo); t += DIA_MS) {
    const dia = utcParaDia(t);
    const venda = porDia.get(dia);
    pontos.push({ dia, quantidade: venda?.quantidade ?? 0, receita: venda?.receita ?? 0 });
  }
  return pontos;
}

export type ChaveSituacao = "confirmados" | "pendentes" | "cancelados";

export interface ParteSituacao {
  chave: ChaveSituacao;
  rotulo: string;
  quantidade: number;
  percentual: number;
}

/**
 * Partes mutuamente exclusivas dos ingressos EMITIDOS no período (data da compra),
 * pela situação atual de cada um. Check-ins já estão dentro de confirmados.
 */
export function montarSituacaoIngressos(resumo: ResumoFinanceiro): ParteSituacao[] {
  const partes: Omit<ParteSituacao, "percentual">[] = [
    {
      chave: "confirmados",
      rotulo: "Confirmados",
      quantidade: resumo.ingressosEmitidosConfirmados,
    },
    { chave: "pendentes", rotulo: "Pendentes", quantidade: resumo.ingressosPendentes },
    { chave: "cancelados", rotulo: "Cancelados", quantidade: resumo.ingressosCancelados },
  ];
  const total = partes.reduce((soma, p) => soma + p.quantidade, 0);
  return partes.map((p) => ({ ...p, percentual: total === 0 ? 0 : (p.quantidade * 100) / total }));
}

export function rotuloPerfil(cargo: string): string {
  return ACCOUNT_TYPE_CONFIG[cargo]?.label ?? cargo;
}

const formatadorMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor);
}

export function formatarPercentual(valor: number): string {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

/** `YYYY-MM-DD` → `DD/MM/YYYY` sem passar por `Date` (evita deslocamento de fuso). */
export function formatarDia(dia: string): string {
  const [ano, mes, d] = dia.slice(0, 10).split("-");
  return `${d}/${mes}/${ano}`;
}

export function descreverPeriodo(periodo: Periodo): string {
  if (periodo.inicio && periodo.fim)
    return `${formatarDia(periodo.inicio)} a ${formatarDia(periodo.fim)}`;
  if (periodo.inicio) return `A partir de ${formatarDia(periodo.inicio)}`;
  if (periodo.fim) return `Até ${formatarDia(periodo.fim)}`;
  return "Todo o período";
}

/**
 * Limite do período personalizado. Medido: 0001→9999 gera ~2,96 mi de pontos diários
 * (1,7 s só para montar a série, antes de renderizar) e o backend recusa 9999-12-31.
 * 10 anos (≈3.650 pontos) cobre qualquer análise diária; histórico maior usa "Tudo".
 */
export const MAX_DIAS_PERIODO_PERSONALIZADO = 3660;

/** Mensagem de erro do período personalizado, ou `null` se válido (datas parciais são válidas). */
export function validarPeriodoPersonalizado(periodo: Periodo): string | null {
  if (!periodo.inicio || !periodo.fim) return null;
  if (periodo.fim < periodo.inicio)
    return "A data final deve ser igual ou posterior à data inicial.";
  const dias = (Date.parse(periodo.fim) - Date.parse(periodo.inicio)) / (24 * 60 * 60 * 1000) + 1;
  if (dias > MAX_DIAS_PERIODO_PERSONALIZADO)
    return "O período personalizado pode ter no máximo 10 anos. Para o histórico completo, use “Tudo”.";
  return null;
}

/** Corta um rótulo longo com reticências; quem exibe deve oferecer o nome completo (title/tooltip). */
export function truncarRotulo(texto: string, maxCaracteres: number): string {
  if (maxCaracteres < 2 || texto.length <= maxCaracteres) return texto;
  return `${texto.slice(0, maxCaracteres - 1).trimEnd()}…`;
}

/**
 * Quebra um rótulo por palavras em até `maxLinhas` linhas de `maxCaracteres`; o que sobrar vai
 * para a última linha, cortado com reticências. Evita que nomes com o mesmo começo
 * ("Organizador de Time" / "Organizador de Campeonato") fiquem idênticos quando encurtados.
 */
export function quebrarRotulo(texto: string, maxCaracteres: number, maxLinhas = 2): string[] {
  const palavras = texto.trim().split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let i = 0;
  while (i < palavras.length && linhas.length < maxLinhas - 1) {
    let linha = palavras[i];
    if (linha.length > maxCaracteres) break; // palavra maior que a linha: vai cortada na última linha
    i++;
    while (i < palavras.length && `${linha} ${palavras[i]}`.length <= maxCaracteres) {
      linha += ` ${palavras[i]}`;
      i++;
    }
    linhas.push(linha);
  }
  if (i < palavras.length) linhas.push(truncarRotulo(palavras.slice(i).join(" "), maxCaracteres));
  return linhas;
}

// ─── Indicadores (fonte única para tela, CSV e PDF) ─────────────────────────

export type ChaveIndicador =
  | "receita"
  | "comparecimento"
  | "novosUsuarios"
  | "campeonatosEmAndamento"
  | "partidasRealizadas"
  | "timesAtivos";

export interface Indicador {
  chave: ChaveIndicador;
  rotulo: string;
  valor: string;
  dica: string;
  /** "atual" = situação do momento, não depende do período selecionado. */
  escopo: "periodo" | "atual";
}

export const DEFINICAO_RECEITA =
  "Receita confirmada: ingressos pagos ou utilizados, pela data do pagamento (horário de Brasília).";
export const DEFINICAO_COMPARECIMENTO =
  "Comparecimento: check-ins ÷ ingressos confirmados de partidas já iniciadas ou finalizadas com data no período.";
export const NOTA_USUARIOS_GLOBAIS =
  "Novos usuários e usuários por perfil não são filtrados por esporte.";
export const NOTA_SITUACAO_ATUAL =
  "Campeonatos em andamento, times ativos e campeonatos por esporte mostram a situação atual e não dependem do período.";

/** Os seis indicadores do painel, na ordem da tela. */
export function montarIndicadores(relatorio: RelatorioAdministrativo): Indicador[] {
  const r = relatorio.resumoFinanceiro;
  const semBaseComparecimento = r.ingressosElegiveisCheckIn === 0;
  return [
    {
      chave: "receita",
      rotulo: "Receita confirmada",
      valor: formatarMoeda(r.receitaConfirmada),
      dica: `${r.ingressosPagos} ingresso${r.ingressosPagos === 1 ? "" : "s"} · pela data do pagamento`,
      escopo: "periodo",
    },
    {
      chave: "comparecimento",
      rotulo: "Comparecimento",
      valor: semBaseComparecimento ? "—" : formatarPercentual(r.taxaComparecimento),
      dica: semBaseComparecimento
        ? "sem ingressos confirmados de partidas já iniciadas"
        : `${r.checkIns} de ${r.ingressosElegiveisCheckIn} · partidas já iniciadas`,
      escopo: "periodo",
    },
    {
      chave: "novosUsuarios",
      rotulo: "Novos usuários",
      valor: String(relatorio.novosUsuarios),
      dica: `${relatorio.usuariosTotais} no total · todos os esportes`,
      escopo: "periodo",
    },
    {
      chave: "campeonatosEmAndamento",
      rotulo: "Campeonatos em andamento",
      valor: String(relatorio.campeonatosEmAndamento),
      dica: `${relatorio.campeonatosTotais} cadastrados`,
      escopo: "atual",
    },
    {
      chave: "partidasRealizadas",
      rotulo: "Partidas realizadas",
      valor: String(relatorio.partidasRealizadas),
      dica: "finalizadas no período",
      escopo: "periodo",
    },
    {
      chave: "timesAtivos",
      rotulo: "Times ativos",
      valor: String(relatorio.timesAtivos),
      dica: "cadastrados e ativos",
      escopo: "atual",
    },
  ];
}

/** Aviso sobre receita confirmada sem data de pagamento (registros anteriores à coluna), ou `null`. */
export function notaReceitaSemData(relatorio: RelatorioAdministrativo): string | null {
  const r = relatorio.resumoFinanceiro;
  if (r.ingressosSemDataPagamento === 0) return null;
  const quantidade = `${r.ingressosSemDataPagamento} ingresso${r.ingressosSemDataPagamento === 1 ? "" : "s"}`;
  const base = `${formatarMoeda(r.receitaSemDataPagamento)} (${quantidade}) confirmados sem data de pagamento registrada`;
  const periodoLimitado = Boolean(relatorio.inicio || relatorio.fim);
  return periodoLimitado
    ? `${base} ficam fora deste período, pois não é possível saber quando foram pagos.`
    : `${base} estão incluídos no total, mas não aparecem no gráfico diário.`;
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

const SEPARADOR = ";";

function decimalCsv(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}

/**
 * Planilhas tratam como fórmula um texto que começa com = + - @, e também ignoram espaços,
 * tab, CR e outros caracteres de controle antes desses prefixos.
 */
const PREFIXO_DE_FORMULA = /^[\s\u0000-\u001f]*[=+\-@]/;

function celulaCsv(valor: string | number): string {
  // Números gerados pelo próprio relatório não vêm do usuário e não precisam de neutralização.
  if (typeof valor === "number") return String(valor);
  let texto = valor;
  if (PREFIXO_DE_FORMULA.test(texto)) texto = `'${texto}`;
  return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function linha(...celulas: (string | number)[]): string {
  return celulas.map(celulaCsv).join(SEPARADOR);
}

export interface ContextoExportacao {
  periodo: string;
  esporte: string;
}

/** CSV no padrão do Excel pt-BR: `;` como separador e vírgula decimal. Mesmo recorte e indicadores da tela. */
export function gerarCsvRelatorioAdministrativo(
  relatorio: RelatorioAdministrativo,
  contexto: ContextoExportacao,
): string {
  const r = relatorio.resumoFinanceiro;
  const serie = preencherSerieDiaria(relatorio.vendasPorDia, relatorio.inicio, relatorio.fim);
  const notaSemData = notaReceitaSemData(relatorio);

  const linhas = [
    linha("Relatório administrativo Kivo"),
    linha("Período", contexto.periodo),
    linha("Esporte", contexto.esporte),
    linha("Observação", NOTA_USUARIOS_GLOBAIS),
    linha("Observação", NOTA_SITUACAO_ATUAL),
    ...(notaSemData ? [linha("Observação", notaSemData)] : []),
    "",
    linha("Indicadores do painel"),
    linha("Indicador", "Valor", "Detalhe", "Escopo"),
    ...montarIndicadores(relatorio).map((i) =>
      linha(i.rotulo, i.valor, i.dica, i.escopo === "atual" ? "Situação atual" : "Período"),
    ),
    "",
    linha("Detalhamento"),
    linha("Indicador", "Valor"),
    linha("Receita confirmada (data do pagamento)", decimalCsv(r.receitaConfirmada)),
    linha("Ingressos confirmados (data do pagamento)", r.ingressosPagos),
    linha("Receita confirmada sem data de pagamento", decimalCsv(r.receitaSemDataPagamento)),
    linha("Ingressos confirmados sem data de pagamento", r.ingressosSemDataPagamento),
    linha("Ingressos emitidos no período (data da compra)", r.ingressosEmitidos),
    linha("Emitidos no período: confirmados", r.ingressosEmitidosConfirmados),
    linha("Emitidos no período: pendentes", r.ingressosPendentes),
    linha("Emitidos no período: cancelados", r.ingressosCancelados),
    linha("Ingressos de partidas já iniciadas no período", r.ingressosElegiveisCheckIn),
    linha("Check-ins nessas partidas", r.checkIns),
    linha(
      "Comparecimento (%)",
      r.ingressosElegiveisCheckIn === 0 ? "—" : decimalCsv(r.taxaComparecimento),
    ),
    linha("Usuários totais (todos os esportes)", relatorio.usuariosTotais),
    linha("Campeonatos cadastrados (situação atual)", relatorio.campeonatosTotais),
    "",
    linha("Receita confirmada por dia (data do pagamento, horário de Brasília)"),
    linha("Dia", "Ingressos", "Receita"),
    ...serie.map((p) => linha(p.dia, p.quantidade, decimalCsv(p.receita))),
    "",
    linha("Usuários por perfil (base total, todos os esportes)"),
    linha("Perfil", "Quantidade"),
    ...relatorio.usuariosPorPerfil.map((u) => linha(rotuloPerfil(u.nome), u.quantidade)),
    "",
    linha("Campeonatos cadastrados por esporte (situação atual)"),
    linha("Esporte", "Quantidade"),
    ...relatorio.campeonatosPorEsporte.map((c) => linha(c.nome, c.quantidade)),
  ];
  return linhas.join("\r\n");
}
