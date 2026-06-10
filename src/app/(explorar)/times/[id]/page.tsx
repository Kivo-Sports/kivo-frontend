"use client";

import { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy, Calendar, MapPin, Clock, Swords, History, Award,
  ChevronRight, type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Card } from "@/components/molecules/Card";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import { FavoriteButton } from "@/components/molecules/FavoriteButton";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { fadeInUp, getFadeTransition, containerVariants, itemVariants } from "@/lib/motion";
import { obterStatusCampeonato, formatarPeriodo, formatarDataJogo } from "@/lib/campeonato.ui";
import { useObterTimePorIdQuery } from "@/store/api/timeApi";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import {
  useListarJogosQuery,
  useObterChaveamentoQuery,
  useObterClassificacaoQuery,
} from "@/store/api/partidaApi";
import type { CampeonatoResponse } from "@/types/campeonato";

type Aba = "campeonatos" | "titulos" | "proximos" | "passados";

// ─── Linha de campeonato (link → detalhe do campeonato) ───────────────────────

function CampeonatoRow({ camp }: { camp: CampeonatoResponse }) {
  const statusCfg = obterStatusCampeonato(camp.status);
  return (
    <Link href={`/campeonatos/${camp.id}`} style={{ textDecoration: "none" }}>
      <motion.div
        variants={itemVariants}
        style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,230,118,0.06)"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.25)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
      >
        <Avatar name={camp.nome} src={camp.logoUrl || undefined} size="sm" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: "0 0 2px", fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {camp.nome}
          </p>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
            <Icon icon={Calendar} size={11} />
            {formatarPeriodo(camp.dataInicio, camp.dataFim)}
          </p>
        </div>
        <Badge variant={statusCfg.variant} size="sm">{statusCfg.label}</Badge>
        <Icon icon={ChevronRight} size={16} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
      </motion.div>
    </Link>
  );
}

// ─── Jogos do time num campeonato ─────────────────────────────────────────────

interface TimeJogoView {
  id: string;
  adversario: string;
  logoAdversario: string | null;
  golsTime: number;
  golsAdversario: number;
  finalizado: boolean;
  mandante: boolean;
  etiqueta: string;
  dataHora: string | null;
}

function TimeJogoRow({ jogo }: { jogo: TimeJogoView }) {
  const resultado = !jogo.finalizado
    ? null
    : jogo.golsTime > jogo.golsAdversario ? "V"
    : jogo.golsTime < jogo.golsAdversario ? "D" : "E";
  const corResultado =
    resultado === "V" ? "var(--color-feedback-success)"
    : resultado === "D" ? "var(--color-feedback-danger)"
    : resultado === "E" ? "var(--color-feedback-warning)"
    : "var(--color-text-muted)";
  const dataFormatada = formatarDataJogo(jogo.dataHora);

  return (
    <Link href={`/jogos/${jogo.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", transition: "all 0.15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,230,118,0.06)"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.25)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
      >
        <span
          style={{
            flexShrink: 0, fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "3px 7px", borderRadius: "var(--radius-full)",
            color: jogo.mandante ? "var(--color-brand-primary)" : "var(--color-text-muted)",
            background: jogo.mandante ? "rgba(0,230,118,0.1)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${jogo.mandante ? "rgba(0,230,118,0.25)" : "rgba(255,255,255,0.08)"}`,
          }}
        >
          {jogo.mandante ? "Casa" : "Fora"}
        </span>

        <Avatar name={jogo.adversario} src={jogo.logoAdversario || undefined} size="sm" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {jogo.adversario}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{jogo.etiqueta}</span>
            {dataFormatada && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                <Icon icon={Calendar} size={11} style={{ color: "var(--color-text-muted)" }} />
                {dataFormatada}
              </span>
            )}
          </div>
        </div>

        {jogo.finalizado ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
            <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "white" }}>
              {jogo.golsTime} × {jogo.golsAdversario}
            </span>
            <span style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: corResultado, background: "rgba(255,255,255,0.05)", border: `1px solid ${corResultado}` }}>
              {resultado}
            </span>
          </div>
        ) : (
          <span style={{ flexShrink: 0, fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)" }}>A jogar</span>
        )}
      </div>
    </Link>
  );
}

function montarJogosDoTime(
  timeNome: string,
  jogos: ReturnType<typeof useListarJogosQuery>["data"],
  chaveamento: ReturnType<typeof useObterChaveamentoQuery>["data"],
): TimeJogoView[] {
  const todos: TimeJogoView[] = [];
  for (const j of jogos ?? []) {
    if (j.nomeTimeCasa === timeNome || j.nomeTimeVisitante === timeNome) {
      const mandante = j.nomeTimeCasa === timeNome;
      todos.push({
        id: j.id,
        adversario: mandante ? j.nomeTimeVisitante : j.nomeTimeCasa,
        logoAdversario: mandante ? j.logoTimeVisitante : j.logoTimeCasa,
        golsTime: mandante ? j.golsTimeCasa : j.golsTimeVisitante,
        golsAdversario: mandante ? j.golsTimeVisitante : j.golsTimeCasa,
        finalizado: j.finalizado, mandante, etiqueta: `Rodada ${j.rodada}`, dataHora: j.dataHora,
      });
    }
  }
  for (const fase of chaveamento ?? []) {
    for (const p of fase.partidas) {
      if (p.timeCasa === timeNome || p.timeVisitante === timeNome) {
        const mandante = p.timeCasa === timeNome;
        todos.push({
          id: p.id,
          adversario: mandante ? p.timeVisitante : p.timeCasa,
          logoAdversario: mandante ? p.logoVisitante : p.logoCasa,
          golsTime: mandante ? p.golsCasa : p.golsVisitante,
          golsAdversario: mandante ? p.golsVisitante : p.golsCasa,
          finalizado: p.finalizado, mandante, etiqueta: fase.fase, dataHora: p.dataHora,
        });
      }
    }
  }
  return todos;
}

function JogosDoTime({ campeonato, timeNome, filtro }: { campeonato: CampeonatoResponse; timeNome: string; filtro: "proximos" | "passados" }) {
  const usaPontos = campeonato.formatoCampeonato === "PontosCorridos" || campeonato.formatoCampeonato === "Hibrido";
  const usaMata = campeonato.formatoCampeonato === "MataMata" || campeonato.formatoCampeonato === "Hibrido";

  const { data: jogos = [], isLoading: carregandoJogos } = useListarJogosQuery(campeonato.id, { skip: !usaPontos });
  const { data: chaveamento = [], isLoading: carregandoChave } = useObterChaveamentoQuery(campeonato.id, { skip: !usaMata });

  const todos = montarJogosDoTime(timeNome, jogos, chaveamento);
  const filtrados = todos.filter((j) => (filtro === "passados" ? j.finalizado : !j.finalizado));
  const carregando = (usaPontos && carregandoJogos) || (usaMata && carregandoChave);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <Avatar name={campeonato.nome} src={campeonato.logoUrl || undefined} size="sm" />
        <p style={{ margin: 0, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.1em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {campeonato.nome}
        </p>
      </div>
      {carregando ? (
        <p style={{ margin: 0, padding: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Carregando jogos...</p>
      ) : filtrados.length === 0 ? (
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", padding: "var(--space-3)", textAlign: "center", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
          {filtro === "passados" ? "Nenhum jogo disputado ainda" : "Nenhum jogo agendado"}
        </p>
      ) : (
        filtrados.map((j) => <TimeJogoRow key={j.id} jogo={j} />)
      )}
    </div>
  );
}

// ─── Detector de título (campeonato finalizado) ───────────────────────────────
// Não renderiza UI: apenas calcula se o time foi campeão e reporta ao pai.

function DetectorTitulo({
  campeonato, timeId, timeNome, onResult,
}: {
  campeonato: CampeonatoResponse;
  timeId: string;
  timeNome: string;
  onResult: (campeonatoId: string, campeao: boolean) => void;
}) {
  const usaMata = campeonato.formatoCampeonato === "MataMata" || campeonato.formatoCampeonato === "Hibrido";

  const { data: chaveamento = [] } = useObterChaveamentoQuery(campeonato.id, { skip: !usaMata });
  const { data: tabela = [] } = useObterClassificacaoQuery(campeonato.id, { skip: usaMata });

  const campeao = useMemo(() => {
    if (usaMata) {
      const final = chaveamento.find((f) => f.fase === "Final");
      const partida = final?.partidas?.[0];
      if (!partida || !partida.finalizado) return false;
      if (partida.golsCasa === partida.golsVisitante) return false;
      const vencedor = partida.golsCasa > partida.golsVisitante ? partida.timeCasa : partida.timeVisitante;
      return vencedor === timeNome;
    }
    const lider = tabela.find((l) => l.posicao === 1);
    return lider?.timeId === timeId;
  }, [usaMata, chaveamento, tabela, timeId, timeNome]);

  // Reporta o resultado ao pai. onResult é estável (useCallback no pai).
  useEffect(() => {
    onResult(campeonato.id, campeao);
  }, [campeao, campeonato.id, onResult]);

  return null;
}

function TabHeader({ dot, label, count }: { dot: string; label: string; count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      <p style={{ margin: 0, fontSize: "var(--text-xs)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-secondary)" }}>{label}</p>
      {count > 0 && (
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 18, height: 18, borderRadius: "var(--radius-full)", background: "rgba(255,255,255,0.08)", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)", fontWeight: 700, padding: "0 5px" }}>{count}</span>
      )}
    </div>
  );
}

function EmptyGroup({ label }: { label: string }) {
  return (
    <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)", padding: "var(--space-3)", textAlign: "center", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.07)" }}>
      {label}
    </p>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function ExplorarTimeDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [aba, setAba] = useState<Aba>("campeonatos");
  const [logoAmpliada, setLogoAmpliada] = useState(false);
  const [titulosMap, setTitulosMap] = useState<Record<string, boolean>>({});

  const { data: time, isLoading, isError } = useObterTimePorIdQuery(id);
  const { data: todosCampeonatos = [] } = useListarCampeonatosQuery();

  const reportarTitulo = useCallback((campeonatoId: string, campeao: boolean) => {
    setTitulosMap((prev) => (prev[campeonatoId] === campeao ? prev : { ...prev, [campeonatoId]: campeao }));
  }, []);

  const campeonatosDoTime = useMemo(
    () => todosCampeonatos.filter((c) => c.times?.includes(id) ?? false),
    [todosCampeonatos, id],
  );

  const participando = campeonatosDoTime.filter((c) => c.status === "InscricoesAbertas" || c.status === "EmAndamento");
  const historico = campeonatosDoTime.filter((c) => c.status === "Finalizado" || c.status === "Cancelado");
  const emAndamento = campeonatosDoTime.filter((c) => c.status === "EmAndamento");
  const comHistorico = campeonatosDoTime.filter((c) => c.status === "EmAndamento" || c.status === "Finalizado");
  const finalizados = useMemo(() => campeonatosDoTime.filter((c) => c.status === "Finalizado"), [campeonatosDoTime]);

  const campeonatosCampeao = finalizados.filter((c) => titulosMap[c.id]);

  if (isLoading) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size="lg" ariaLabel="Carregando time" />
      </main>
    );
  }

  if (isError || !time) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)" }}>
        <p style={{ color: "var(--color-feedback-danger)", margin: 0 }}>Time não encontrado.</p>
        <Link href="/times" style={{ color: "var(--color-brand-primary)", textDecoration: "none", fontSize: "var(--text-sm)" }}>
          Voltar para times
        </Link>
      </main>
    );
  }

  const TABS: { key: Aba; label: string; icon: LucideIcon }[] = [
    { key: "campeonatos", label: "Campeonatos", icon: Trophy },
    { key: "titulos", label: "Títulos", icon: Award },
    { key: "proximos", label: "Próximos jogos", icon: Swords },
    { key: "passados", label: "Jogos passados", icon: History },
  ];

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "1100px", margin: "0 auto" }}
    >
      {/* Breadcrumb */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <BotaoVoltar fallbackHref="/times" />
      </div>

      {/* Hero */}
      <Card
        padding="lg"
        style={{
          background: "linear-gradient(160deg, rgba(18,18,18,0.98), rgba(10,10,10,0.99))",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          marginBottom: "var(--space-6)",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: "var(--space-3)", right: "var(--space-3)", zIndex: 2 }}>
          <FavoriteButton tipo="Time" itemId={id} nome={time.nome} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setLogoAmpliada(true)}
            style={{ background: "none", border: "none", padding: 0, cursor: "zoom-in", borderRadius: "999px", flexShrink: 0 }}
            aria-label="Ampliar logo do time"
          >
            <Avatar name={time.nome} src={time.logoUrl || undefined} size="xl" />
          </button>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <h1 style={{ margin: "0 0 var(--space-2)", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 700, color: "white", lineHeight: 1.2 }}>
              {time.nome}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                <Icon icon={MapPin} size={12} style={{ color: "var(--color-text-muted)" }} />
                {time.cidade} · {time.estado}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                <Icon icon={Clock} size={12} style={{ color: "var(--color-text-muted)" }} />
                Desde {new Date(time.criadoEm).toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", alignItems: "stretch", gap: "var(--space-4)", flexShrink: 0, padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-xl)", background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-brand-primary)", lineHeight: 1 }}>{campeonatosDoTime.length}</p>
              <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Campeonatos</p>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.1)", alignSelf: "stretch" }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 700, color: "#facc15", lineHeight: 1 }}>{campeonatosCampeao.length}</p>
              <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>Títulos</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Abas */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "var(--space-5)", padding: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
        {TABS.map((t) => {
          const ativo = aba === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setAba(t.key)}
              style={{
                flex: "1 0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
                fontSize: "var(--text-sm)", fontWeight: 600, whiteSpace: "nowrap",
                background: ativo ? "rgba(0,230,118,0.12)" : "transparent",
                color: ativo ? "var(--color-brand-primary)" : "var(--color-text-muted)",
                boxShadow: ativo ? "0 1px 8px rgba(0,230,118,0.12)" : "none",
                transition: "all 0.15s",
              }}
            >
              <Icon icon={t.icon} size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Aba: Campeonatos */}
      {aba === "campeonatos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          <div>
            <TabHeader dot="var(--color-brand-primary)" label="Participando" count={participando.length} />
            {participando.length === 0 ? (
              <EmptyGroup label="Nenhum campeonato ativo no momento" />
            ) : (
              <motion.div variants={containerVariants} initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {participando.map((c) => <CampeonatoRow key={c.id} camp={c} />)}
              </motion.div>
            )}
          </div>
          <div>
            <TabHeader dot="var(--color-text-muted)" label="Histórico" count={historico.length} />
            {historico.length === 0 ? (
              <EmptyGroup label="Nenhum campeonato encerrado registrado" />
            ) : (
              <motion.div variants={containerVariants} initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {historico.map((c) => <CampeonatoRow key={c.id} camp={c} />)}
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* Aba: Títulos */}
      {aba === "titulos" && (
        finalizados.length === 0 ? (
          <EmptyGroup label="Este time ainda não disputou campeonatos finalizados" />
        ) : campeonatosCampeao.length === 0 ? (
          <EmptyGroup label="Este time ainda não conquistou títulos" />
        ) : (
          <motion.div variants={containerVariants} initial="initial" animate="animate" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "var(--space-3)" }}>
            {campeonatosCampeao.map((c) => (
              <motion.div key={c.id} variants={itemVariants}>
                <Link href={`/campeonatos/${c.id}`} style={{ textDecoration: "none" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-4)", borderRadius: "var(--radius-xl)", background: "linear-gradient(160deg, rgba(250,204,21,0.08), rgba(250,204,21,0.02))", border: "1px solid rgba(250,204,21,0.25)", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(250,204,21,0.5)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(250,204,21,0.25)"; }}
                  >
                    <div style={{ width: "40px", height: "40px", borderRadius: "var(--radius-lg)", background: "rgba(250,204,21,0.12)", border: "1px solid rgba(250,204,21,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon icon={Trophy} size={20} style={{ color: "#facc15" }} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ margin: "0 0 2px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#facc15" }}>Campeão</p>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )
      )}

      {/* Aba: Próximos jogos */}
      {aba === "proximos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {emAndamento.length === 0 ? (
            <EmptyGroup label="Este time não tem jogos agendados no momento" />
          ) : (
            emAndamento.map((c) => <JogosDoTime key={c.id} campeonato={c} timeNome={time.nome} filtro="proximos" />)
          )}
        </div>
      )}

      {/* Aba: Jogos passados */}
      {aba === "passados" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          {comHistorico.length === 0 ? (
            <EmptyGroup label="Este time ainda não disputou nenhum jogo" />
          ) : (
            comHistorico.map((c) => <JogosDoTime key={c.id} campeonato={c} timeNome={time.nome} filtro="passados" />)
          )}
        </div>
      )}

      {/* Detectores de título (sempre montados, sem UI) */}
      {finalizados.map((c) => (
        <DetectorTitulo key={c.id} campeonato={c} timeId={id} timeNome={time.nome} onResult={reportarTitulo} />
      ))}

      {/* Modal logo ampliada */}
      {logoAmpliada && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visualizar logo do time"
          onClick={() => setLogoAmpliada(false)}
          style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)", backdropFilter: "blur(3px)" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}>
            <Avatar name={time.nome} src={time.logoUrl || undefined} size="2xl" />
            <button
              type="button"
              onClick={() => setLogoAmpliada(false)}
              style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "white", borderRadius: "var(--radius-full)", padding: "6px 12px", fontSize: "var(--text-sm)", cursor: "pointer" }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </motion.main>
  );
}
