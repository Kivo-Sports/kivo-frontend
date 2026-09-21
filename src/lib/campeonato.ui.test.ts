import { describe, expect, it } from "vitest";

import {
  CAMPEONATO_STATUS,
  formatarDataJogo,
  formatarPeriodo,
  obterCampeao,
  obterStatusCampeonato,
} from "./campeonato.ui";
import type { ChaveamentoResponse, TabelaClassificacaoResponse } from "@/types/partida";

describe("obterStatusCampeonato", () => {
  it("retorna a config visual de um status conhecido", () => {
    expect(obterStatusCampeonato("EmAndamento")).toBe(CAMPEONATO_STATUS.EmAndamento);
    expect(obterStatusCampeonato("Cancelado").label).toBe("Cancelado");
  });

  it("cai no fallback Rascunho para status desconhecido", () => {
    expect(obterStatusCampeonato("EstadoInexistente")).toBe(CAMPEONATO_STATUS.Rascunho);
  });
});

describe("formatarPeriodo", () => {
  it("formata as duas datas em pt-BR separadas por seta", () => {
    expect(formatarPeriodo("2026-05-01T00:00:00.000Z", "2026-06-30T00:00:00.000Z")).toMatch(
      /\d{2}\/\d{2}\/2026 → \d{2}\/\d{2}\/2026/,
    );
  });
});

describe("formatarDataJogo", () => {
  it("retorna null quando nao ha data", () => {
    expect(formatarDataJogo(null)).toBeNull();
  });

  it("retorna null para data invalida", () => {
    expect(formatarDataJogo("nao-e-uma-data")).toBeNull();
  });

  it("inclui hora quando o horario nao e meia-noite (UTC)", () => {
    const resultado = formatarDataJogo("2026-05-01T15:30:00.000Z");
    expect(resultado).toContain("·");
  });

  it("nao inclui hora quando o horario e meia-noite local", () => {
    const meiaNoiteLocal = new Date(2026, 4, 1, 0, 0).toISOString();
    expect(formatarDataJogo(meiaNoiteLocal)).not.toContain("·");
  });
});

describe("obterCampeao", () => {
  const classificacao: TabelaClassificacaoResponse[] = [
    { posicao: 2, nomeTime: "Segundo", logoUrl: null } as TabelaClassificacaoResponse,
    { posicao: 1, nomeTime: "Lider", logoUrl: "logo.png" } as TabelaClassificacaoResponse,
  ];

  it("pontos corridos: retorna o lider da tabela pela posicao", () => {
    const campeao = obterCampeao("PontosCorridos", classificacao, []);
    expect(campeao).toEqual({ nome: "Lider", logoUrl: "logo.png" });
  });

  it("pontos corridos: retorna null quando nao ha classificacao", () => {
    expect(obterCampeao("PontosCorridos", [], [])).toBeNull();
  });

  it("mata-mata: retorna o vencedor da final quando finalizada", () => {
    const chaveamento: ChaveamentoResponse[] = [
      {
        fase: "Final",
        partidas: [
          {
            finalizado: true,
            golsCasa: 3,
            golsVisitante: 1,
            timeCasa: "Casa FC",
            timeVisitante: "Visitante FC",
            logoCasa: "casa.png",
            logoVisitante: "visitante.png",
          },
        ],
      } as unknown as ChaveamentoResponse,
    ];

    expect(obterCampeao("MataMata", [], chaveamento)).toEqual({
      nome: "Casa FC",
      logoUrl: "casa.png",
    });
  });

  it("mata-mata: reconhece vitoria do visitante", () => {
    const chaveamento: ChaveamentoResponse[] = [
      {
        fase: "Final",
        partidas: [
          {
            finalizado: true,
            golsCasa: 0,
            golsVisitante: 2,
            timeCasa: "Casa FC",
            timeVisitante: "Visitante FC",
            logoCasa: "casa.png",
            logoVisitante: "visitante.png",
          },
        ],
      } as unknown as ChaveamentoResponse,
    ];

    expect(obterCampeao("Hibrido", [], chaveamento)).toEqual({
      nome: "Visitante FC",
      logoUrl: "visitante.png",
    });
  });

  it("mata-mata: retorna null quando a final ainda nao aconteceu", () => {
    const chaveamento: ChaveamentoResponse[] = [
      { fase: "Final", partidas: [] } as unknown as ChaveamentoResponse,
    ];

    expect(obterCampeao("MataMata", [], chaveamento)).toBeNull();
  });

  it("mata-mata: retorna null em caso de empate (nao deveria acontecer, mas nao quebra)", () => {
    const chaveamento: ChaveamentoResponse[] = [
      {
        fase: "Final",
        partidas: [
          {
            finalizado: true,
            golsCasa: 1,
            golsVisitante: 1,
            timeCasa: "Casa FC",
            timeVisitante: "Visitante FC",
            logoCasa: null,
            logoVisitante: null,
          },
        ],
      } as unknown as ChaveamentoResponse,
    ];

    expect(obterCampeao("MataMata", [], chaveamento)).toBeNull();
  });

  it("retorna null para formato desconhecido", () => {
    expect(obterCampeao("FormatoDesconhecido", classificacao, [])).toBeNull();
  });
});
