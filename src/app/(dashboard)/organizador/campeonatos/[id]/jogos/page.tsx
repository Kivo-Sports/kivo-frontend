"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Swords, Calendar, AlertTriangle, ChevronRight } from "lucide-react";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import { Avatar } from "@/components/atoms/Avatar";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { useToast } from "@/components/atoms/Toast";
import { fadeInUp, getFadeTransition } from "@/lib/motion";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import {
  useListarJogosQuery,
  useObterChaveamentoQuery,
  useGerarTabelaMutation,
} from "@/store/api/partidaApi";

interface PartidaItem {
  id: string;
  timeCasa: string;
  timeVisitante: string;
  logoCasa: string | null;
  logoVisitante: string | null;
  golsCasa: number;
  golsVisitante: number;
  finalizado: boolean;
}

// ─── Linha de partida (clicável → detalhe do jogo) ───────────────────────────

function PartidaRow({ partida, onAbrir }: { partida: PartidaItem; onAbrir: (id: string) => void }) {
  return (
    <button
      onClick={() => onAbrir(partida.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3) var(--space-4)",
        borderRadius: "var(--radius-lg)",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,230,118,0.06)"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.25)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
    >
      {/* Time casa */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "var(--space-2)" }}>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {partida.timeCasa}
        </span>
        <Avatar name={partida.timeCasa} src={partida.logoCasa || undefined} size="sm" />
      </div>

      {/* Placar */}
      <span style={{ minWidth: "58px", textAlign: "center", fontSize: "var(--text-lg)", fontWeight: 700, color: partida.finalizado ? "var(--color-brand-primary)" : "var(--color-text-muted)" }}>
        {partida.finalizado ? `${partida.golsCasa} × ${partida.golsVisitante}` : "×"}
      </span>

      {/* Time visitante */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <Avatar name={partida.timeVisitante} src={partida.logoVisitante || undefined} size="sm" />
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {partida.timeVisitante}
        </span>
      </div>

      <Icon icon={ChevronRight} size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
    </button>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function JogosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: campeonatos = [], isLoading: loadingCamp } = useListarCampeonatosQuery();
  const campeonato = campeonatos.find((c) => c.id === id) ?? null;
  const formato = campeonato?.formatoCampeonato ?? "";

  const usaPontosCorridos = formato === "PontosCorridos" || formato === "Hibrido";
  const usaMataMata = formato === "MataMata" || formato === "Hibrido";

  const { data: jogos = [], isLoading: loadingJogos, isError: erroJogos } = useListarJogosQuery(id, {
    skip: !campeonato || !usaPontosCorridos,
  });
  const { data: chaveamento = [], isLoading: loadingChave } = useObterChaveamentoQuery(id, {
    skip: !campeonato || !usaMataMata,
  });

  const [gerarTabela, { isLoading: gerando }] = useGerarTabelaMutation();

  const abrirJogo = (jogoId: string) => {
    router.push(`/organizador/campeonatos/${id}/jogo/${jogoId}`);
  };

  const handleGerar = async () => {
    try {
      await gerarTabela(id).unwrap();
      toastSuccess("Tabela de jogos gerada com sucesso!");
    } catch (err) {
      const msg =
        typeof err === "object" && err !== null && "data" in err && typeof (err as { data: unknown }).data === "string"
          ? (err as { data: string }).data
          : "Não foi possível gerar a tabela de jogos.";
      toastError(msg, "Erro");
    }
  };

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

  // Agrupa jogos de pontos corridos por rodada
  const rodadas = new Map<number, PartidaItem[]>();
  for (const j of jogos) {
    const item: PartidaItem = {
      id: j.id,
      timeCasa: j.nomeTimeCasa,
      timeVisitante: j.nomeTimeVisitante,
      logoCasa: j.logoTimeCasa,
      logoVisitante: j.logoTimeVisitante,
      golsCasa: j.golsTimeCasa,
      golsVisitante: j.golsTimeVisitante,
      finalizado: j.finalizado,
    };
    const lista = rodadas.get(j.rodada) ?? [];
    lista.push(item);
    rodadas.set(j.rodada, lista);
  }
  const rodadasOrdenadas = [...rodadas.entries()].sort((a, b) => a[0] - b[0]);

  const totalChaveamento = chaveamento.reduce((acc, f) => acc + f.partidas.length, 0);
  const semJogos = jogos.length === 0 && totalChaveamento === 0 && !erroJogos;
  const carregando = (usaPontosCorridos && loadingJogos) || (usaMataMata && loadingChave);

  // Após qualquer placar registrado, regerar a tabela não é mais permitido
  const algumJogoRegistrado =
    jogos.some((j) => j.finalizado) ||
    chaveamento.some((f) => f.partidas.some((p) => p.finalizado));

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "880px", margin: "0 auto", padding: "var(--space-6) var(--space-4)" }}
    >
      {/* Breadcrumb */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <BotaoVoltar fallbackHref={`/organizador/campeonatos/${id}`} label={`Voltar para ${campeonato.nome}`} />
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap", marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "var(--radius-lg)", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon icon={Swords} size={20} style={{ color: "var(--color-brand-primary)" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700, color: "white" }}>Jogos &amp; Placares</h1>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>{campeonato.nome}</p>
          </div>
        </div>
        {!semJogos && !algumJogoRegistrado && (
          <Button variant="ghost" onClick={handleGerar} loading={gerando} size="sm">
            Regerar tabela
          </Button>
        )}
      </div>

      {/* Dica de navegação */}
      {!carregando && !semJogos && (
        <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          Clique em um jogo para definir data, local e registrar o placar.
        </p>
      )}

      {/* Estado: erro do endpoint de jogos */}
      {usaPontosCorridos && erroJogos && (
        <Card padding="lg" style={{ borderColor: "rgba(255,193,7,0.3)", marginBottom: "var(--space-4)" }}>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <Icon icon={AlertTriangle} size={20} style={{ color: "var(--color-feedback-warning)", flexShrink: 0 }} />
            <div>
              <p style={{ margin: "0 0 var(--space-1)", fontWeight: 600, color: "white", fontSize: "var(--text-sm)" }}>
                Listagem de jogos indisponível
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                Não foi possível carregar os jogos de pontos corridos. Verifique se o backend está atualizado.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Carregando */}
      {carregando && (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="md" ariaLabel="Carregando jogos" />
        </div>
      )}

      {/* Estado vazio */}
      {!carregando && semJogos && (
        <Card padding="lg" style={{ textAlign: "center" }}>
          <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-3)" }}>
            <Icon icon={Trophy} size={22} style={{ color: "var(--color-text-muted)" }} />
          </div>
          <p style={{ margin: "0 0 var(--space-1)", fontWeight: 600, color: "white", fontSize: "var(--text-sm)" }}>
            Nenhum jogo gerado ainda
          </p>
          <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
            Gere a tabela de jogos a partir dos times confirmados neste campeonato.
          </p>
          <Button variant="primary" onClick={handleGerar} loading={gerando}>
            Gerar tabela de jogos
          </Button>
        </Card>
      )}

      {/* Rodadas — pontos corridos */}
      {!carregando && rodadasOrdenadas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {rodadasOrdenadas.map(([rodada, partidas]) => (
            <Card key={`rodada-${rodada}`} padding="md">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                <Icon icon={Calendar} size={14} style={{ color: "var(--color-brand-primary)" }} />
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-brand-primary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Rodada {rodada}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {partidas.map((p) => (
                  <PartidaRow key={p.id} partida={p} onAbrir={abrirJogo} />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Fases — mata-mata */}
      {!carregando && totalChaveamento > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", marginTop: rodadasOrdenadas.length > 0 ? "var(--space-5)" : 0 }}>
          {chaveamento.map((fase) => (
            <Card key={`fase-${fase.fase}`} padding="md">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                <Icon icon={Trophy} size={14} style={{ color: "var(--color-brand-primary)" }} />
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-brand-primary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  {fase.fase}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {fase.partidas
                  .slice()
                  .sort((a, b) => a.numeroJogoChave - b.numeroJogoChave)
                  .map((p) => (
                    <PartidaRow
                      key={p.id}
                      partida={{
                        id: p.id,
                        timeCasa: p.timeCasa,
                        timeVisitante: p.timeVisitante,
                        logoCasa: p.logoCasa,
                        logoVisitante: p.logoVisitante,
                        golsCasa: p.golsCasa,
                        golsVisitante: p.golsVisitante,
                        finalizado: p.finalizado,
                      }}
                      onAbrir={abrirJogo}
                    />
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.main>
  );
}
