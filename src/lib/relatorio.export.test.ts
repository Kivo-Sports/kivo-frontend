import type { jsPDF as JsPdf } from "jspdf";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { exportarPdfRelatorioAdministrativo } from "./relatorio.export";
import { NOTA_SITUACAO_ATUAL, NOTA_USUARIOS_GLOBAIS, montarIndicadores } from "./relatorio.utils";
import { relatorioAdministrativoFixture } from "@/test/msw/handlers";

// `save` é atribuído por instância no jsPDF, então o mock estende a classe para capturar
// cada documento gerado e impedir o download.
const pdfs = vi.hoisted(() => [] as { documento: JsPdf; salvoComo?: string; textos: string[] }[]);

vi.mock("jspdf", async (importOriginal) => {
  const original = await importOriginal<typeof import("jspdf")>();
  class JsPdfCapturado extends original.jsPDF {
    constructor(...args: ConstructorParameters<typeof original.jsPDF>) {
      super(...args);
      const registro: { documento: JsPdf; salvoComo?: string; textos: string[] } = {
        documento: this,
        textos: [],
      };
      pdfs.push(registro);
      // Captura o texto escrito (a saída binária do PDF codifica acentos).
      const escreverOriginal = this.text.bind(this);
      this.text = ((texto: string | string[], ...resto: unknown[]) => {
        registro.textos.push(...(Array.isArray(texto) ? texto : [texto]));
        return (escreverOriginal as (...args: unknown[]) => JsPdf)(texto, ...resto);
      }) as unknown as JsPdf["text"];
      this.save = ((nome: string) => {
        registro.salvoComo = nome;
        return this;
      }) as unknown as JsPdf["save"];
    }
  }
  return { ...original, jsPDF: JsPdfCapturado };
});

beforeEach(() => {
  pdfs.length = 0;
  // Sem logo (o arquivo estático não existe no jsdom): cai no título em texto.
  vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("sem rede"));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("exportarPdfRelatorioAdministrativo", () => {
  it("gera o PDF com indicadores e tabelas e salva com nome do recorte", async () => {
    await exportarPdfRelatorioAdministrativo(relatorioAdministrativoFixture, {
      periodo: "01/10/2026 a 03/10/2026",
      esporte: "Todos os esportes",
    });

    expect(pdfs).toHaveLength(1);
    expect(pdfs[0].salvoComo).toBe("relatorio-kivo-todos-os-esportes-01-10-2026-a-03-10-2026.pdf");
    const conteudo = pdfs[0].documento.output();
    expect(conteudo).toContain("Receita confirmada");
    expect(conteudo).toContain("Campeonatos cadastrados por esporte");
  });

  it("traz os mesmos seis indicadores da tela e as notas de escopo", async () => {
    const relatorio = { ...relatorioAdministrativoFixture, esporteId: "e1" };

    await exportarPdfRelatorioAdministrativo(relatorio, { periodo: "x", esporte: "Futebol" });

    const texto = pdfs[0].textos.join("\n");
    const indicadores = montarIndicadores(relatorio);
    expect(indicadores).toHaveLength(6);
    for (const indicador of indicadores) {
      expect(texto).toContain(indicador.rotulo);
      expect(texto).toContain(indicador.valor);
    }
    // "Ingressos confirmados" era um KPI só do PDF; agora o PDF não promete métricas fora da tela.
    expect(pdfs[0].textos).not.toContain("Ingressos confirmados");
    expect(texto.replace(/\s+/g, " ")).toContain(NOTA_USUARIOS_GLOBAIS);
    expect(texto.replace(/\s+/g, " ")).toContain(NOTA_SITUACAO_ATUAL);
    expect(texto).toContain("Situação atual · ");
  });

  it("pagina quando a série de vendas não cabe em uma folha", async () => {
    const vendasPorDia = Array.from({ length: 90 }, (_, i) => ({
      data: new Date(Date.UTC(2026, 6, 1 + i)).toISOString(),
      quantidade: 1,
      receita: 10,
    }));

    await exportarPdfRelatorioAdministrativo(
      { ...relatorioAdministrativoFixture, vendasPorDia },
      { periodo: "x", esporte: "Todos os esportes" },
    );

    expect(pdfs[0].documento.getNumberOfPages()).toBeGreaterThan(1);
  });
});
