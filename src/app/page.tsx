"use client";

/**
 * @file page.tsx
 * @description Home de demonstracao do design system + motion base.
 *
 * Essa tela nao eh a home final do produto. Eu deixei ela como laboratorio
 * para validar animacoes, cards e lista dinamica antes de levar para as
 * telas reais de campeonato e ingresso.
 *
 * @author Kivo Sports - TCC
 */

// - React
import { useState } from "react";

// - Framer Motion
import { motion } from "framer-motion";

// - Componentes
import { AnimatedList } from "@/components/atoms/AnimatedList";
import { AnimatedNumber } from "@/components/atoms/AnimatedNumber";
import { AnimatedPage } from "@/components/atoms/AnimatedPage";
import { FadeIn } from "@/components/atoms/FadeIn";
import { MotionCard } from "@/components/molecules/MotionCard";

// - Motion config
import { containerVariants, itemVariants, mediumMotionTransition } from "@/lib/motion";

type JogoDaRodada = {
  id: number;
  title: string;
  status: string;
};

const jogosIniciaisDaRodada: JogoDaRodada[] = [
  { id: 1, title: "Ajax FC vs Estrela Azul", status: "Em 30 min" },
  { id: 2, title: "Uniao Norte vs Bairro 7", status: "Aguardando arbitragem" },
  { id: 3, title: "Racha Prime vs Kivo United", status: "Finalizado" },
];

export default function Home() {
  const [jogosDaRodada, setJogosDaRodada] = useState<JogoDaRodada[]>(jogosIniciaisDaRodada);
  const [placarDoKivoFc, setPlacarDoKivoFc] = useState(1);

  function handleAdicionarJogoTeste(): void {
    const idDoNovoJogo = Date.now();

    const novoJogoDaRodada: JogoDaRodada = {
      id: idDoNovoJogo,
      title: `Novo jogo #${jogosDaRodada.length + 1}`,
      status: "Agendado agora",
    };

    setJogosDaRodada((listaAtualDeJogos) => [novoJogoDaRodada, ...listaAtualDeJogos]);
  }

  function handleRemoverJogo(idDoJogo: number): void {
    setJogosDaRodada((listaAtualDeJogos) =>
      listaAtualDeJogos.filter((jogoDaLista) => jogoDaLista.id !== idDoJogo),
    );
  }

  function handleSomarGolNoPlacarDemo(): void {
    setPlacarDoKivoFc((placarAtual) => placarAtual + 1);
  }

  return (
    <AnimatedPage>
      <main
        style={{
          minHeight: "100vh",
          padding: "var(--space-8)",
          background:
            "radial-gradient(circle at 15% 20%, rgba(0, 230, 118, 0.16), transparent 35%), radial-gradient(circle at 85% 0%, rgba(255, 214, 0, 0.1), transparent 30%), var(--color-bg-base)",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "grid",
            gap: "var(--space-5)",
          }}
        >
          <FadeIn delay={0} direction="up">
            <header className="card-elevated" style={{ padding: "var(--space-6)" }}>
              <p
                className="text-muted"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  marginBottom: "var(--space-2)",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Kivo Motion Foundation
              </p>
              <h1 style={{ marginBottom: "var(--space-2)" }}>Tela inicial com animacoes base</h1>
              <p className="text-secondary" style={{ maxWidth: 720 }}>
                Estrutura para validar transicoes, listas, cards e placar com movimento fluido,
                sutil e orientado a contexto.
              </p>
            </header>
          </FadeIn>

          <FadeIn delay={0.1} direction="up">
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "var(--space-4)",
              }}
            >
              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Card Interativo</h2>
                  <p className="card-subtitle">Hover e tap configurados via MotionCard.</p>
                </div>
                <p className="text-secondary" style={{ marginBottom: "var(--space-4)" }}>
                  Passe o mouse ou toque para perceber scale e sombra suaves em padrao Apple-like.
                </p>
                <button className="btn btn-primary" type="button">
                  Acao Principal
                </button>
              </MotionCard>

              <MotionCard style={{ padding: "var(--space-5)" }}>
                <div className="card-header">
                  <h2 className="card-title">Placar Animado</h2>
                  <p className="card-subtitle">Contagem progressiva com destaque visual.</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <p className="text-secondary">Kivo FC:</p>
                  <AnimatedNumber
                    value={placarDoKivoFc}
                    duration={0.6}
                    className="text-primary"
                    style={{ fontSize: "var(--text-3xl)", fontWeight: "var(--font-bold)" }}
                  />
                </div>
                <div style={{ marginTop: "var(--space-4)" }}>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={handleSomarGolNoPlacarDemo}
                  >
                    Somar Gol
                  </button>
                </div>
              </MotionCard>
            </section>
          </FadeIn>

          <FadeIn delay={0.2} direction="up">
            <section className="card" style={{ padding: "var(--space-5)" }}>
              <div className="card-header">
                <h2 className="card-title">Lista com AutoAnimate</h2>
                <p className="card-subtitle">
                  Entrada e remocao de jogos com transicao automatica.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-4)",
                }}
              >
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={handleAdicionarJogoTeste}
                >
                  Adicionar Jogo
                </button>
              </div>

              <AnimatedList>
                <motion.ul
                  variants={containerVariants}
                  initial="initial"
                  animate="animate"
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "grid",
                    gap: "var(--space-3)",
                  }}
                >
                  {jogosDaRodada.map((jogoDaRodada) => (
                    <motion.li
                      key={jogoDaRodada.id}
                      variants={itemVariants}
                      transition={mediumMotionTransition}
                      className="card"
                      style={{ padding: "var(--space-4)" }}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div>
                          <strong style={{ display: "block", marginBottom: "var(--space-1)" }}>
                            {jogoDaRodada.title}
                          </strong>
                          <p className="text-muted">{jogoDaRodada.status}</p>
                        </div>
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => handleRemoverJogo(jogoDaRodada.id)}
                        >
                          Remover
                        </button>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              </AnimatedList>
            </section>
          </FadeIn>
        </div>
      </main>
    </AnimatedPage>
  );
}
