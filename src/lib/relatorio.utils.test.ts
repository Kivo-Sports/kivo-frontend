import { describe, expect, it } from "vitest";

import {
  calcularPeriodo,
  gerarCsvRelatorioAdministrativo,
  montarIndicadores,
  montarSituacaoIngressos,
  notaReceitaSemData,
  preencherSerieDiaria,
  quebrarRotulo,
  rotuloPerfil,
  truncarRotulo,
  validarPeriodoPersonalizado,
} from "./relatorio.utils";
import type { RelatorioAdministrativo, ResumoFinanceiro } from "@/types/relatorio";

const resumoZerado: ResumoFinanceiro = {
  receitaConfirmada: 0,
  ingressosPagos: 0,
  receitaSemDataPagamento: 0,
  ingressosSemDataPagamento: 0,
  ingressosEmitidos: 0,
  ingressosEmitidosConfirmados: 0,
  ingressosPendentes: 0,
  ingressosCancelados: 0,
  checkIns: 0,
  ingressosElegiveisCheckIn: 0,
  taxaComparecimento: 0,
};

const hoje = new Date(2026, 9, 5); // 05/10/2026, horário local

describe("calcularPeriodo", () => {
  it("'7d' cobre os últimos 7 dias incluindo hoje", () => {
    expect(calcularPeriodo("7d", hoje)).toEqual({ inicio: "2026-09-29", fim: "2026-10-05" });
  });

  it("'30d' cobre os últimos 30 dias incluindo hoje", () => {
    expect(calcularPeriodo("30d", hoje)).toEqual({ inicio: "2026-09-06", fim: "2026-10-05" });
  });

  it("'12m' começa no mesmo dia do ano anterior + 1", () => {
    expect(calcularPeriodo("12m", hoje)).toEqual({ inicio: "2025-10-06", fim: "2026-10-05" });
  });

  it("'tudo' não envia limites", () => {
    expect(calcularPeriodo("tudo", hoje)).toEqual({});
  });
});

describe("preencherSerieDiaria", () => {
  it("preenche com zero os dias sem venda dentro do período", () => {
    const serie = preencherSerieDiaria(
      [
        { data: "2026-10-01T00:00:00Z", quantidade: 2, receita: 100 },
        { data: "2026-10-03T00:00:00Z", quantidade: 1, receita: 30 },
      ],
      "2026-09-30",
      "2026-10-04",
    );

    expect(serie.map((p) => p.dia)).toEqual([
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
    ]);
    expect(serie.map((p) => p.receita)).toEqual([0, 100, 0, 30, 0]);
    expect(serie.map((p) => p.quantidade)).toEqual([0, 2, 0, 1, 0]);
  });

  it("usa o dia UTC da string, sem deslocar pelo fuso local", () => {
    const serie = preencherSerieDiaria(
      [{ data: "2026-10-01T00:00:00Z", quantidade: 1, receita: 10 }],
      "2026-10-01",
      "2026-10-01",
    );

    expect(serie).toEqual([{ dia: "2026-10-01", quantidade: 1, receita: 10 }]);
  });

  it("sem início, começa no primeiro dia com venda", () => {
    const serie = preencherSerieDiaria(
      [
        { data: "2026-10-02T00:00:00Z", quantidade: 1, receita: 10 },
        { data: "2026-10-04T00:00:00Z", quantidade: 1, receita: 20 },
      ],
      undefined,
      undefined,
    );

    expect(serie.map((p) => p.dia)).toEqual(["2026-10-02", "2026-10-03", "2026-10-04"]);
  });

  it("sem vendas e sem período retorna série vazia", () => {
    expect(preencherSerieDiaria([], undefined, undefined)).toEqual([]);
  });
});

describe("montarSituacaoIngressos", () => {
  it("separa os ingressos emitidos em confirmados, pendentes e cancelados", () => {
    const partes = montarSituacaoIngressos({
      ...resumoZerado,
      // Pagos pela data do pagamento não entram: a situação é dos EMITIDOS no período.
      ingressosPagos: 99,
      ingressosEmitidos: 10,
      ingressosEmitidosConfirmados: 6,
      ingressosPendentes: 3,
      ingressosCancelados: 1,
    });

    expect(partes.map((p) => [p.chave, p.quantidade])).toEqual([
      ["confirmados", 6],
      ["pendentes", 3],
      ["cancelados", 1],
    ]);
    expect(partes.reduce((soma, p) => soma + p.percentual, 0)).toBeCloseTo(100);
  });

  it("com zero ingressos todos os percentuais são zero", () => {
    const partes = montarSituacaoIngressos(resumoZerado);

    expect(partes.every((p) => p.percentual === 0)).toBe(true);
  });
});

describe("rotuloPerfil", () => {
  it("traduz o nome do enum de cargo do backend", () => {
    expect(rotuloPerfil("OrganizadorCampeonato")).toBe("Organizador de Campeonato");
    expect(rotuloPerfil("Torcedor")).toBe("Torcedor");
  });

  it("devolve o próprio nome quando o cargo é desconhecido", () => {
    expect(rotuloPerfil("Desconhecido")).toBe("Desconhecido");
  });
});

describe("gerarCsvRelatorioAdministrativo", () => {
  const relatorio: RelatorioAdministrativo = {
    inicio: "2026-10-01",
    fim: "2026-10-02",
    esporteId: null,
    usuariosTotais: 10,
    novosUsuarios: 2,
    campeonatosTotais: 3,
    campeonatosEmAndamento: 1,
    partidasRealizadas: 4,
    timesAtivos: 5,
    resumoFinanceiro: {
      ...resumoZerado,
      receitaConfirmada: 150.5,
      ingressosPagos: 3,
      ingressosEmitidos: 4,
      ingressosEmitidosConfirmados: 3,
      ingressosPendentes: 1,
      checkIns: 1,
      ingressosElegiveisCheckIn: 3,
      taxaComparecimento: 33.33,
    },
    vendasPorDia: [{ data: "2026-10-01T00:00:00", quantidade: 3, receita: 150.5 }],
    usuariosPorPerfil: [{ nome: "Torcedor", quantidade: 8 }],
    campeonatosPorEsporte: [{ nome: "Futebol; Society", quantidade: 3 }],
  };

  it("usa ';' como separador e vírgula decimal (Excel pt-BR)", () => {
    const csv = gerarCsvRelatorioAdministrativo(relatorio, {
      periodo: "01/10/2026 a 02/10/2026",
      esporte: "Todos",
    });

    expect(csv).toContain("Receita confirmada (data do pagamento);150,50");
    expect(csv).toContain("2026-10-01;3;150,50");
    expect(csv).toContain("2026-10-02;0;0,00");
  });

  it("escapa valores que contêm o separador", () => {
    const csv = gerarCsvRelatorioAdministrativo(relatorio, { periodo: "x", esporte: "Todos" });

    expect(csv).toContain('"Futebol; Society";3');
  });

  it("traz o perfil já traduzido", () => {
    const csv = gerarCsvRelatorioAdministrativo(relatorio, { periodo: "x", esporte: "Todos" });

    expect(csv).toContain("Torcedor;8");
  });

  it("exporta os mesmos seis indicadores da tela, com o mesmo texto", () => {
    const csv = gerarCsvRelatorioAdministrativo(relatorio, { periodo: "x", esporte: "Todos" });

    for (const indicador of montarIndicadores(relatorio)) {
      expect(csv).toContain(`${indicador.rotulo};${indicador.valor};${indicador.dica}`);
    }
  });

  it("avisa que usuários não são filtrados por esporte e o que é situação atual", () => {
    const csv = gerarCsvRelatorioAdministrativo(relatorio, { periodo: "x", esporte: "Vôlei" });

    expect(csv).toContain("não são filtrados por esporte");
    expect(csv).toContain("Times ativos;5;cadastrados e ativos;Situação atual");
  });
});

describe("montarIndicadores", () => {
  const base: RelatorioAdministrativo = {
    inicio: "2026-10-01",
    fim: "2026-10-05",
    esporteId: null,
    usuariosTotais: 10,
    novosUsuarios: 2,
    campeonatosTotais: 3,
    campeonatosEmAndamento: 1,
    partidasRealizadas: 4,
    timesAtivos: 5,
    resumoFinanceiro: {
      ...resumoZerado,
      ingressosElegiveisCheckIn: 4,
      checkIns: 3,
      taxaComparecimento: 75,
    },
    vendasPorDia: [],
    usuariosPorPerfil: [],
    campeonatosPorEsporte: [],
  };

  it("marca campeonatos em andamento e times ativos como situação atual", () => {
    const escopos = Object.fromEntries(montarIndicadores(base).map((i) => [i.chave, i.escopo]));

    expect(escopos).toEqual({
      receita: "periodo",
      comparecimento: "periodo",
      novosUsuarios: "periodo",
      campeonatosEmAndamento: "atual",
      partidasRealizadas: "periodo",
      timesAtivos: "atual",
    });
  });

  it("comparecimento mostra a base de partidas já iniciadas", () => {
    const comparecimento = montarIndicadores(base).find((i) => i.chave === "comparecimento")!;

    expect(comparecimento.valor).toBe("75%");
    expect(comparecimento.dica).toBe("3 de 4 · partidas já iniciadas");
  });

  it("sem partida iniciada no período, comparecimento fica sem valor em vez de 0%", () => {
    const semBase = { ...base, resumoFinanceiro: { ...resumoZerado } };
    const comparecimento = montarIndicadores(semBase).find((i) => i.chave === "comparecimento")!;

    expect(comparecimento.valor).toBe("—");
  });
});

describe("notaReceitaSemData", () => {
  const comLegado = (inicio: string | null): RelatorioAdministrativo => ({
    inicio,
    fim: inicio,
    esporteId: null,
    usuariosTotais: 0,
    novosUsuarios: 0,
    campeonatosTotais: 0,
    campeonatosEmAndamento: 0,
    partidasRealizadas: 0,
    timesAtivos: 0,
    resumoFinanceiro: {
      ...resumoZerado,
      receitaSemDataPagamento: 270,
      ingressosSemDataPagamento: 6,
    },
    vendasPorDia: [],
    usuariosPorPerfil: [],
    campeonatosPorEsporte: [],
  });

  it("com período, explica que os registros sem data ficam fora", () => {
    expect(notaReceitaSemData(comLegado("2026-10-01"))).toMatch(
      /6 ingressos.*ficam fora deste período/,
    );
  });

  it("sem período, explica que entram no total mas não no gráfico diário", () => {
    expect(notaReceitaSemData(comLegado(null))).toMatch(
      /incluídos no total, mas não aparecem no gráfico diário/,
    );
  });

  it("sem registros antigos, não há aviso", () => {
    expect(notaReceitaSemData({ ...comLegado(null), resumoFinanceiro: resumoZerado })).toBeNull();
  });
});

describe("validarPeriodoPersonalizado", () => {
  it("aceita datas parciais e intervalos de até 10 anos", () => {
    expect(validarPeriodoPersonalizado({ inicio: "2026-01-01" })).toBeNull();
    expect(validarPeriodoPersonalizado({ inicio: "2016-10-06", fim: "2026-10-05" })).toBeNull();
  });

  it("recusa fim antes do início", () => {
    expect(validarPeriodoPersonalizado({ inicio: "2026-10-05", fim: "2026-10-04" })).toMatch(
      /data final/,
    );
  });

  it("recusa intervalos extensos que travariam a série diária", () => {
    expect(validarPeriodoPersonalizado({ inicio: "0001-01-01", fim: "9999-12-31" })).toMatch(
      /no máximo 10 anos/,
    );
  });
});

describe("CSV: nomes adversariais (injeção de fórmula)", () => {
  const relatorioCom = (nome: string): RelatorioAdministrativo => ({
    inicio: null,
    fim: null,
    esporteId: null,
    usuariosTotais: 0,
    novosUsuarios: 0,
    campeonatosTotais: 1,
    campeonatosEmAndamento: 0,
    partidasRealizadas: 0,
    timesAtivos: 0,
    resumoFinanceiro: {
      receitaConfirmada: 0,
      ingressosPagos: 0,
      receitaSemDataPagamento: 0,
      ingressosSemDataPagamento: 0,
      ingressosEmitidos: 0,
      ingressosEmitidosConfirmados: 0,
      ingressosPendentes: 0,
      ingressosCancelados: 0,
      checkIns: 0,
      ingressosElegiveisCheckIn: 0,
      taxaComparecimento: 0,
    },
    vendasPorDia: [],
    usuariosPorPerfil: [],
    campeonatosPorEsporte: [{ nome, quantidade: 1 }],
  });

  /** Primeira célula da linha do esporte, já sem as aspas de escape do CSV. */
  const celulaDoEsporte = (nome: string) => {
    const csv = gerarCsvRelatorioAdministrativo(relatorioCom(nome), { periodo: "x", esporte: "y" });
    const linhaFinal = csv.split("\r\n").at(-1)!;
    const celula = linhaFinal.slice(0, linhaFinal.lastIndexOf(";"));
    return celula.startsWith('"') ? celula.slice(1, -1).replace(/""/g, '"') : celula;
  };

  it.each([
    ["=1+1"],
    ["+1"],
    ["-1"],
    ["@SUM(A1)"],
    [" =1+1"],
    ["  @SUM(A1)"],
    ["\t=1+1"],
    ["\r=1+1"],
    ["\u0000=1+1"],
    ["\u001f+1"],
  ])("neutraliza %j com apóstrofo inicial", (nome) => {
    expect(celulaDoEsporte(nome).startsWith("'")).toBe(true);
  });

  it("não altera nomes comuns", () => {
    expect(celulaDoEsporte("Futebol Society")).toBe("Futebol Society");
  });

  it("não prefixa valores numéricos gerados pelo relatório", () => {
    const csv = gerarCsvRelatorioAdministrativo(relatorioCom("Futebol"), {
      periodo: "x",
      esporte: "y",
    });
    expect(csv).toContain("Futebol;1");
  });
});

describe("truncarRotulo", () => {
  it("corta nomes longos com reticências", () => {
    expect(truncarRotulo("Futebol Phase3 20260824155705", 12)).toBe("Futebol Pha…");
  });

  it("mantém nomes que cabem", () => {
    expect(truncarRotulo("Vôlei", 12)).toBe("Vôlei");
  });
});

describe("quebrarRotulo", () => {
  it("quebra por palavras em até duas linhas para nomes parecidos continuarem distinguíveis", () => {
    expect(quebrarRotulo("Organizador de Time", 15)).toEqual(["Organizador de", "Time"]);
    expect(quebrarRotulo("Organizador de Campeonato", 15)).toEqual([
      "Organizador de",
      "Campeonato",
    ]);
  });

  it("corta com reticências o que não cabe na última linha", () => {
    expect(quebrarRotulo("Futebol Phase3 20260824155705 extra", 15)).toEqual([
      "Futebol Phase3",
      "20260824155705…",
    ]);
  });

  it("corta uma palavra única maior que a linha", () => {
    expect(quebrarRotulo("Superlongonomesemespacos", 10)).toEqual(["Superlong…"]);
  });

  it("mantém em uma linha o que cabe", () => {
    expect(quebrarRotulo("Futsal", 15)).toEqual(["Futsal"]);
  });
});
