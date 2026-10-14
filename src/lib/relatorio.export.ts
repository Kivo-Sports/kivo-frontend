/**
 * @file relatorio.export.ts
 * @description Exportação do relatório administrativo em CSV e PDF (jspdf, client-side).
 * O PDF é pensado para impressão: fundo branco, KPIs e tabelas do mesmo recorte da tela.
 */

import { carregarLogo, nomeArquivoSeguro } from "@/lib/ingresso.pdf";
import {
  DEFINICAO_COMPARECIMENTO,
  DEFINICAO_RECEITA,
  NOTA_SITUACAO_ATUAL,
  NOTA_USUARIOS_GLOBAIS,
  formatarDia,
  formatarMoeda,
  formatarPercentual,
  gerarCsvRelatorioAdministrativo,
  montarIndicadores,
  montarSituacaoIngressos,
  notaReceitaSemData,
  preencherSerieDiaria,
  rotuloPerfil,
  type ContextoExportacao,
} from "@/lib/relatorio.utils";
import type { RelatorioAdministrativo } from "@/types/relatorio";

function nomeArquivo(contexto: ContextoExportacao, extensao: string): string {
  return `relatorio-kivo-${nomeArquivoSeguro(`${contexto.esporte} ${contexto.periodo}`)}.${extensao}`;
}

function baixarBlob(blob: Blob, nome: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nome;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportarCsvRelatorioAdministrativo(
  relatorio: RelatorioAdministrativo,
  contexto: ContextoExportacao,
): void {
  // BOM para o Excel abrir acentuação corretamente em UTF-8.
  const csv = `﻿${gerarCsvRelatorioAdministrativo(relatorio, contexto)}`;
  baixarBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), nomeArquivo(contexto, "csv"));
}

const MARGEM = 16;
const LARGURA_UTIL = 210 - MARGEM * 2;
const LIMITE_PAGINA = 297 - 20;

export async function exportarPdfRelatorioAdministrativo(
  relatorio: RelatorioAdministrativo,
  contexto: ContextoExportacao,
): Promise<void> {
  const [{ jsPDF }, logo] = await Promise.all([import("jspdf"), carregarLogo()]);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  pdf.setProperties({
    title: "Relatório administrativo Kivo Sports",
    subject: `${contexto.esporte} - ${contexto.periodo}`,
    author: "Kivo Sports",
    creator: "Kivo Sports",
  });

  let y = 0;

  const garantirEspaco = (altura: number) => {
    if (y + altura > LIMITE_PAGINA) {
      pdf.addPage();
      y = 20;
    }
  };

  const tituloSecao = (texto: string) => {
    garantirEspaco(14);
    pdf.setTextColor(20, 20, 20);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text(texto, MARGEM, y);
    y += 6;
  };

  const tabela = (cabecalho: string[], linhas: string[][], larguras: number[]) => {
    const alturaLinha = 7;
    const desenharCabecalho = () => {
      pdf.setFillColor(240, 240, 240);
      pdf.rect(MARGEM, y, LARGURA_UTIL, alturaLinha, "F");
      pdf.setTextColor(66, 66, 66);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      let x = MARGEM + 2;
      cabecalho.forEach((celula, i) => {
        const alinharDireita = i > 0;
        pdf.text(celula, alinharDireita ? x + larguras[i] - 4 : x, y + 4.8, {
          align: alinharDireita ? "right" : "left",
        });
        x += larguras[i];
      });
      y += alturaLinha;
    };

    garantirEspaco(alturaLinha * 2);
    desenharCabecalho();
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(26, 26, 26);
    linhas.forEach((celulas) => {
      if (y + alturaLinha > LIMITE_PAGINA) {
        pdf.addPage();
        y = 20;
        desenharCabecalho();
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(26, 26, 26);
      }
      let x = MARGEM + 2;
      celulas.forEach((celula, i) => {
        const alinharDireita = i > 0;
        const texto = (pdf.splitTextToSize(celula, larguras[i] - 4) as string[])[0] ?? "";
        pdf.text(texto, alinharDireita ? x + larguras[i] - 4 : x, y + 4.8, {
          align: alinharDireita ? "right" : "left",
        });
        x += larguras[i];
      });
      pdf.setDrawColor(224, 224, 224);
      pdf.line(MARGEM, y + alturaLinha, MARGEM + LARGURA_UTIL, y + alturaLinha);
      y += alturaLinha;
    });
    y += 8;
  };

  // ─── Cabeçalho ──────────────────────────────────────────────────────────────
  pdf.setFillColor(0, 230, 118);
  pdf.rect(0, 0, 210, 3, "F");
  if (logo) {
    pdf.addImage(logo, "PNG", MARGEM, 10, 36, 14, undefined, "FAST");
  } else {
    pdf.setTextColor(0, 137, 123);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("KIVO SPORTS", MARGEM, 20);
  }
  pdf.setTextColor(117, 117, 117);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8.5);
  pdf.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, 194, 16, { align: "right" });

  pdf.setTextColor(20, 20, 20);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Relatório administrativo", MARGEM, 36);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(66, 66, 66);
  pdf.text(`Período: ${contexto.periodo}    Esporte: ${contexto.esporte}`, MARGEM, 43);
  y = 54;

  // ─── Indicadores: os mesmos seis da tela (fonte única em montarIndicadores) ───
  const r = relatorio.resumoFinanceiro;
  const larguraCartao = (LARGURA_UTIL - 8) / 3;
  const alturaCartao = 27;
  montarIndicadores(relatorio).forEach((indicador, i) => {
    const coluna = i % 3;
    const linhaCartao = Math.floor(i / 3);
    const x = MARGEM + coluna * (larguraCartao + 4);
    const topo = y + linhaCartao * (alturaCartao + 4);
    pdf.setDrawColor(224, 224, 224);
    pdf.roundedRect(x, topo, larguraCartao, alturaCartao, 2, 2, "S");
    pdf.setTextColor(66, 66, 66);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text(indicador.rotulo, x + 4, topo + 7);
    pdf.setTextColor(20, 20, 20);
    pdf.setFontSize(14);
    pdf.text(indicador.valor, x + 4, topo + 15.5);
    pdf.setTextColor(97, 97, 97);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    const dica =
      indicador.escopo === "atual" ? `Situação atual · ${indicador.dica}` : indicador.dica;
    pdf.text(pdf.splitTextToSize(dica, larguraCartao - 8) as string[], x + 4, topo + 21);
  });
  y += (alturaCartao + 4) * 2 + 2;

  // ─── Notas de escopo e definições (as mesmas da tela/CSV) ─────────────────────
  const notas = [
    DEFINICAO_RECEITA,
    DEFINICAO_COMPARECIMENTO,
    NOTA_USUARIOS_GLOBAIS,
    NOTA_SITUACAO_ATUAL,
    notaReceitaSemData(relatorio),
  ].filter((nota): nota is string => Boolean(nota));
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(66, 66, 66);
  notas.forEach((nota) => {
    const linhas = pdf.splitTextToSize(`• ${nota}`, LARGURA_UTIL) as string[];
    garantirEspaco(linhas.length * 4);
    pdf.text(linhas, MARGEM, y);
    y += linhas.length * 4;
  });
  y += 6;

  // ─── Tabelas ────────────────────────────────────────────────────────────────
  tituloSecao("Situação dos ingressos emitidos no período (data da compra)");
  tabela(
    ["Situação atual", "Quantidade", "Participação"],
    montarSituacaoIngressos(r).map((p) => [
      p.rotulo,
      String(p.quantidade),
      formatarPercentual(p.percentual),
    ]),
    [90, 44, 44],
  );

  // No PDF só os dias com pagamento, para o relatório anual não virar dezenas de páginas de zeros (o CSV traz a série completa).
  const diasComPagamento = preencherSerieDiaria(
    relatorio.vendasPorDia,
    relatorio.inicio,
    relatorio.fim,
  ).filter((p) => p.quantidade > 0);
  tituloSecao("Receita confirmada por dia (somente dias com pagamento)");
  tabela(
    ["Dia", "Ingressos", "Receita"],
    diasComPagamento.length > 0
      ? diasComPagamento.map((p) => [
          formatarDia(p.dia),
          String(p.quantidade),
          formatarMoeda(p.receita),
        ])
      : [["Nenhum pagamento confirmado no período", "-", "-"]],
    [90, 44, 44],
  );

  tituloSecao("Campeonatos cadastrados por esporte (situação atual)");
  tabela(
    ["Esporte", "Campeonatos"],
    relatorio.campeonatosPorEsporte.length > 0
      ? relatorio.campeonatosPorEsporte.map((c) => [c.nome, String(c.quantidade)])
      : [["Nenhum campeonato", "-"]],
    [134, 44],
  );

  tituloSecao("Usuários por perfil (base total, todos os esportes)");
  tabela(
    ["Perfil", "Usuários"],
    relatorio.usuariosPorPerfil.map((u) => [rotuloPerfil(u.nome), String(u.quantidade)]),
    [134, 44],
  );

  pdf.save(nomeArquivo(contexto, "pdf"));
}
