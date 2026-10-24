"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GitFork, FlaskConical } from "lucide-react";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import { Card } from "@/components/molecules/Card";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { Chaveamento } from "@/components/organisms/Chaveamento";
import { fadeInUp, getFadeTransition } from "@/lib/motion";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import { useObterChaveamentoQuery, useObterClassificacaoQuery } from "@/store/api/partidaApi";
import type { ChaveamentoResponse } from "@/types/partida";

function faseInicialPorQtd(qtd: number): string {
  if (qtd <= 2) return "Final";
  if (qtd <= 4) return "Semifinais";
  if (qtd <= 8) return "Quartas";
  return "Oitavas";
}

export default function ChaveamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: campeonatos = [], isLoading: loadingCamp } = useListarCampeonatosQuery();
  const campeonato = campeonatos.find((c) => c.id === id) ?? null;
  const ehHibrido = campeonato?.formatoCampeonato === "Hibrido";

  const { data: chaveamento = [], isLoading: loadingChave } = useObterChaveamentoQuery(id, {
    skip: !campeonato,
  });
  const { data: classificacao = [], isFetching: loadingClass } = useObterClassificacaoQuery(id, {
    skip: !campeonato || !ehHibrido,
  });

  if (loadingCamp) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size="lg" ariaLabel="Carregando" />
      </main>
    );
  }

  if (!campeonato) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)" }}>
        <p style={{ color: "var(--color-feedback-danger)", margin: 0 }}>Campeonato não encontrado.</p>
        <Link href="/organizador/campeonatos" style={{ color: "var(--color-brand-primary)", textDecoration: "none", fontSize: "var(--text-sm)" }}>
          Voltar para campeonatos
        </Link>
      </main>
    );
  }

  const totalPartidas = chaveamento.reduce((acc, f) => acc + f.partidas.length, 0);

  // Simulação (Híbrido): monta um chaveamento projetado a partir da classificação atual
  const qtdClassificam = campeonato.quantidadeTimesClassificam ?? 0;
  const mostrarSimulacao = totalPartidas === 0 && ehHibrido && qtdClassificam >= 2;
  const classificados = classificacao.slice(0, qtdClassificam);

  const chaveamentoSimulado: ChaveamentoResponse[] = [];
  if (mostrarSimulacao && classificados.length >= 2) {
    const partidas = [];
    for (let i = 0; i < Math.floor(classificados.length / 2); i++) {
      const casa = classificados[i];
      const visitante = classificados[classificados.length - 1 - i];
      partidas.push({
        id: `sim-${i}`,
        numeroJogoChave: i + 1,
        timeCasa: casa.nomeTime,
        timeVisitante: visitante.nomeTime,
        logoCasa: casa.logoUrl,
        logoVisitante: visitante.logoUrl,
        golsCasa: 0,
        golsVisitante: 0,
        dataHora: null,
        finalizado: false,
      });
    }
    chaveamentoSimulado.push({ fase: faseInicialPorQtd(qtdClassificam), partidas });
  }

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "1100px", margin: "0 auto", padding: "var(--space-6) var(--space-4)" }}
    >
      <div style={{ marginBottom: "var(--space-5)" }}>
        <BotaoVoltar fallbackHref={`/organizador/campeonatos/${id}`} label={`Voltar para ${campeonato.nome}`} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
        <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "var(--radius-lg)", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon icon={GitFork} size={20} style={{ color: "var(--color-brand-primary)" }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700, color: "white" }}>Chaveamento</h1>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{campeonato.nome}</p>
        </div>
      </div>

      {loadingChave || (mostrarSimulacao && loadingClass) ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="md" ariaLabel="Carregando chaveamento" />
        </div>
      ) : totalPartidas > 0 ? (
        // ── Chaveamento real ──────────────────────────────────────────────
        <Card padding="lg">
          <Chaveamento chaveamento={chaveamento} />
        </Card>
      ) : chaveamentoSimulado.length > 0 ? (
        // ── Simulação (Híbrido) ───────────────────────────────────────────
        <div>
          <div style={{ display: "flex", gap: "var(--space-3)", padding: "var(--space-4)", borderRadius: "var(--radius-xl)", background: "rgba(0,230,118,0.04)", border: "1px solid rgba(0,230,118,0.18)", marginBottom: "var(--space-5)" }}>
            <Icon icon={FlaskConical} size={20} style={{ color: "var(--color-brand-primary)", flexShrink: 0 }} />
            <div>
              <p style={{ margin: "0 0 var(--space-1)", fontWeight: 700, color: "white", fontSize: "var(--text-sm)" }}>
                Simulação do mata-mata
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                Prévia baseada na <strong style={{ color: "var(--color-text-secondary)" }}>classificação atual</strong> da fase de pontos corridos.
                Os <strong style={{ color: "var(--color-text-secondary)" }}>{qtdClassificam} primeiros</strong> colocados se classificam.
                O chaveamento oficial é sorteado quando todos os jogos da tabela forem encerrados — os confrontos podem mudar.
              </p>
            </div>
          </div>
          <Card padding="lg">
            <Chaveamento chaveamento={chaveamentoSimulado} />
          </Card>
        </div>
      ) : (
        // ── Estado vazio ──────────────────────────────────────────────────
        <Card padding="lg" style={{ textAlign: "center" }}>
          <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-3)" }}>
            <Icon icon={GitFork} size={22} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <p style={{ margin: "0 0 var(--space-1)", fontWeight: 600, color: "white", fontSize: "var(--text-sm)" }}>
            Chaveamento indisponível
          </p>
          <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            {ehHibrido
              ? "A simulação aparece assim que os primeiros placares da fase de pontos corridos forem lançados."
              : "O chaveamento aparece após a geração dos jogos da fase eliminatória."}
          </p>
          <Link
            href={`/organizador/campeonatos/${id}/jogos`}
            style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-4)", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", textDecoration: "none", fontSize: "var(--text-sm)", fontWeight: 600 }}
          >
            Ir para Jogos &amp; Placares
          </Link>
        </Card>
      )}
    </motion.main>
  );
}
