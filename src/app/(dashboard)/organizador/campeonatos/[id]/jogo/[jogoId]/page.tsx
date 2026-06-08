"use client";

import { use, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Goal, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { ContagemRegressivaJogo } from "@/components/molecules/ContagemRegressivaJogo";
import { DateInput } from "@/components/atoms/DateInput";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { useToast } from "@/components/atoms/Toast";
import { fadeInUp, getFadeTransition } from "@/lib/motion";
import {
  useObterPartidaQuery,
  useAgendarPartidaMutation,
  useAtualizarPlacarMutation,
} from "@/store/api/partidaApi";
import { useObterCampeonatoPorIdQuery } from "@/store/api/campeonatoApi";

const inputStyle = {
  width: "100%",
  height: "40px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "var(--radius-md)",
  padding: "0 var(--space-3)",
  color: "white",
  fontSize: "var(--text-sm)",
  outline: "none",
  boxSizing: "border-box" as const,
};

const labelStyle = {
  margin: "0 0 var(--space-1)",
  fontSize: "var(--text-xs)",
  color: "var(--color-text-muted)",
  display: "block",
} as const;

function extrairMensagemErro(err: unknown, fallback: string): string {
  if (typeof err === "object" && err !== null && "data" in err) {
    const data = (err as { data: unknown }).data;
    if (typeof data === "string" && data.length > 0) return data;
  }
  return fallback;
}

export default function DetalheJogoPage({ params }: { params: Promise<{ id: string; jogoId: string }> }) {
  const { id, jogoId } = use(params);
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: partida, isLoading, isError } = useObterPartidaQuery(jogoId);
  const { data: campeonato } = useObterCampeonatoPorIdQuery(id);
  const [agendarPartida, { isLoading: salvandoAgenda }] = useAgendarPartidaMutation();
  const [atualizarPlacar, { isLoading: salvandoPlacar }] = useAtualizarPlacarMutation();

  const [dataHora, setDataHora] = useState("");
  const [local, setLocal] = useState("");
  const [golsCasa, setGolsCasa] = useState("0");
  const [golsVisitante, setGolsVisitante] = useState("0");
  const [confirmarPlacar, setConfirmarPlacar] = useState(false);

  useEffect(() => {
    if (!partida) return;
    setDataHora(partida.dataHora ? partida.dataHora.slice(0, 16) : "");
    setLocal(partida.local ?? "");
    setGolsCasa(String(partida.golsTimeCasa));
    setGolsVisitante(String(partida.golsTimeVisitante));
  }, [partida]);

  // ─── Gate: placar só fica liberado a partir da hora da partida ────────────
  const [agora, setAgora] = useState<number>(() => Date.now());
  const dataHoraTs = useMemo<number | null>(
    () => (partida?.dataHora ? new Date(partida.dataHora).getTime() : null),
    [partida?.dataHora],
  );
  useEffect(() => {
    if (dataHoraTs == null) return;
    const restante = dataHoraTs - Date.now();
    if (restante <= 0) return;
    // Agenda um único re-render exatamente quando a hora chegar.
    const id = setTimeout(() => setAgora(Date.now()), restante + 500);
    return () => clearTimeout(id);
  }, [dataHoraTs]);
  const partidaJaPodeOcorrer = dataHoraTs == null || dataHoraTs <= agora;

  // ─── Validação: data do jogo não pode passar do fim do campeonato ─────────
  const dataFimCampeonato = useMemo<Date | null>(() => {
    if (!campeonato?.dataFim) return null;
    const d = new Date(campeonato.dataFim);
    if (Number.isNaN(d.getTime())) return null;
    // Permite até o fim do dia da DataFim (no banco vem 00:00).
    d.setHours(23, 59, 59, 999);
    return d;
  }, [campeonato?.dataFim]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const dataFimMaxAttr = dataFimCampeonato
    ? `${dataFimCampeonato.getFullYear()}-${pad(dataFimCampeonato.getMonth() + 1)}-${pad(dataFimCampeonato.getDate())}T23:59`
    : undefined;

  const dataHoraSelecionada = dataHora ? new Date(dataHora) : null;
  const dataAposFimCampeonato = Boolean(
    dataFimCampeonato && dataHoraSelecionada && !Number.isNaN(dataHoraSelecionada.getTime()) && dataHoraSelecionada > dataFimCampeonato
  );

  const handleSalvarAgenda = async () => {
    if (dataAposFimCampeonato) {
      toastError("A data do jogo não pode ser depois do fim do campeonato.", "Data inválida");
      return;
    }
    try {
      await agendarPartida({ partidaId: jogoId, dataHora: dataHora || null, local }).unwrap();
      toastSuccess("Agendamento salvo com sucesso!");
    } catch (err) {
      toastError(extrairMensagemErro(err, "Não foi possível salvar o agendamento."), "Erro");
    }
  };

  const abrirConfirmacaoPlacar = () => {
    const gc = parseInt(golsCasa, 10);
    const gv = parseInt(golsVisitante, 10);
    if (Number.isNaN(gc) || Number.isNaN(gv) || gc < 0 || gv < 0) {
      toastError("Informe um placar válido para os dois times.", "Placar inválido");
      return;
    }
    setConfirmarPlacar(true);
  };

  const handleRegistrarPlacar = async () => {
    const gc = parseInt(golsCasa, 10);
    const gv = parseInt(golsVisitante, 10);
    try {
      await atualizarPlacar({ partidaId: jogoId, golsTimeCasa: gc, golsTimeVisitante: gv }).unwrap();
      toastSuccess("Placar registrado com sucesso!");
      setConfirmarPlacar(false);
    } catch (err) {
      toastError(extrairMensagemErro(err, "Não foi possível registrar o placar."), "Erro");
    }
  };

  if (isLoading) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size="lg" ariaLabel="Carregando jogo" />
      </main>
    );
  }

  if (isError || !partida) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "var(--space-4)" }}>
        <p style={{ color: "var(--color-feedback-danger)", margin: 0 }}>Jogo não encontrado.</p>
        <Link href={`/organizador/campeonatos/${id}/jogos`} style={{ color: "var(--color-brand-primary)", textDecoration: "none", fontSize: "var(--text-sm)" }}>
          Voltar para os jogos
        </Link>
      </main>
    );
  }

  const etiqueta = partida.fase && partida.fase !== "Nenhuma"
    ? partida.fase
    : partida.rodada != null
      ? `Rodada ${partida.rodada}`
      : "Jogo";

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "680px", margin: "0 auto", padding: "var(--space-6) var(--space-4)" }}
    >
      {/* Breadcrumb */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <BotaoVoltar fallbackHref={`/organizador/campeonatos/${id}/jogos`} label="Voltar para os jogos" />
      </div>

      {/* Card do confronto */}
      <Card padding="lg" style={{ marginBottom: "var(--space-5)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-4)" }}>
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--color-brand-primary)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {etiqueta}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-4)" }}>
          {/* Time casa */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
            <Avatar name={partida.nomeTimeCasa} src={partida.logoTimeCasa || undefined} size="lg" />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
              {partida.nomeTimeCasa}
            </span>
          </div>

          {/* Placar */}
          <div style={{ textAlign: "center", flexShrink: 0 }}>
            <p style={{ margin: 0, fontSize: "var(--text-3xl)", fontWeight: 700, color: partida.finalizado ? "var(--color-brand-primary)" : "var(--color-text-muted)", lineHeight: 1 }}>
              {partida.finalizado ? `${partida.golsTimeCasa} × ${partida.golsTimeVisitante}` : "× "}
            </p>
          </div>

          {/* Time visitante */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
            <Avatar name={partida.nomeTimeVisitante} src={partida.logoTimeVisitante || undefined} size="lg" />
            <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>
              {partida.nomeTimeVisitante}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: "var(--space-4)" }}>
          {partida.finalizado ? (
            <Badge variant="success">Encerrada</Badge>
          ) : (
            <ContagemRegressivaJogo dataHora={partida.dataHora} fallback="A jogar" />
          )}
        </div>
      </Card>

      {/* Agendamento */}
      <Card padding="lg" style={{ marginBottom: "var(--space-5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
          <Icon icon={Calendar} size={16} style={{ color: "var(--color-brand-primary)" }} />
          <h2 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "white" }}>Agendamento</h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div>
            <label style={labelStyle}>Data e hora do jogo</label>
            <DateInput
              type="datetime-local"
              max={dataFimMaxAttr}
              aria-invalid={dataAposFimCampeonato}
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
            />
            {dataAposFimCampeonato && (
              <p role="alert" style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-xs)", color: "var(--color-feedback-danger)" }}>
                A data do jogo não pode ser depois do fim do campeonato
                {dataFimCampeonato && ` (${dataFimCampeonato.toLocaleDateString("pt-BR")})`}.
              </p>
            )}
          </div>
          <div>
            <label style={labelStyle}>Local</label>
            <div style={{ position: "relative" }}>
              <Icon icon={MapPin} size={14} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="ex: Estádio Municipal"
                style={{ ...inputStyle, paddingLeft: "calc(var(--space-3) + 14px + var(--space-2))" }}
                value={local}
                onChange={(e) => setLocal(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: "var(--space-4)" }}>
          <Button
            variant="secondary"
            onClick={handleSalvarAgenda}
            loading={salvandoAgenda}
            disabled={dataAposFimCampeonato}
          >
            Salvar agendamento
          </Button>
        </div>
      </Card>

      {/* Placar */}
      <Card padding="lg">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
          <Icon icon={Goal} size={16} style={{ color: "var(--color-brand-primary)" }} />
          <h2 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "white" }}>Placar</h2>
        </div>

        {partida.finalizado ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.2)" }}>
            <Icon icon={CheckCircle} size={15} style={{ color: "var(--color-brand-primary)", flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              Partida encerrada — placar <strong style={{ color: "white" }}>{partida.golsTimeCasa} × {partida.golsTimeVisitante}</strong>. O placar não pode ser editado.
            </p>
          </div>
        ) : !partidaJaPodeOcorrer ? (
          <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-2)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "rgba(255,193,7,0.06)", border: "1px solid rgba(255,193,7,0.25)" }}>
            <Icon icon={Clock} size={15} style={{ color: "rgba(255,193,7,0.95)", flexShrink: 0, marginTop: 2 }} />
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
              O registro do placar será liberado{" "}
              <strong style={{ color: "white" }}>
                a partir de {dataHoraTs != null ? new Date(dataHoraTs).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
              </strong>
              , no horário da partida.
            </p>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-3)" }}>
              <div style={{ flex: 1, textAlign: "right", fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {partida.nomeTimeCasa}
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                onKeyDown={(e) => {
                  const edicao = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
                  if (!edicao.includes(e.key) && !e.ctrlKey && !e.metaKey && !/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                style={{ ...inputStyle, width: "60px", height: "56px", textAlign: "center", fontSize: "var(--text-xl)", fontWeight: 700, borderColor: "rgba(0,230,118,0.3)" }}
                value={golsCasa}
                onChange={(e) => setGolsCasa(e.target.value.replace(/\D/g, ""))}
              />
              <span style={{ color: "var(--color-text-muted)", fontWeight: 700 }}>×</span>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                onKeyDown={(e) => {
                  const edicao = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
                  if (!edicao.includes(e.key) && !e.ctrlKey && !e.metaKey && !/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                style={{ ...inputStyle, width: "60px", height: "56px", textAlign: "center", fontSize: "var(--text-xl)", fontWeight: 700, borderColor: "rgba(0,230,118,0.3)" }}
                value={golsVisitante}
                onChange={(e) => setGolsVisitante(e.target.value.replace(/\D/g, ""))}
              />
              <div style={{ flex: 1, textAlign: "left", fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {partida.nomeTimeVisitante}
              </div>
            </div>

            <p style={{ margin: "var(--space-3) 0 var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textAlign: "center", lineHeight: 1.6 }}>
              Ao registrar o placar, a partida é encerrada e o resultado não poderá mais ser alterado.
            </p>

            <Button variant="primary" fullWidth onClick={abrirConfirmacaoPlacar}>
              Registrar placar
            </Button>
          </>
        )}
      </Card>

      {/* Modal de confirmação do placar */}
      <AnimatePresence>
        {confirmarPlacar && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => !salvandoPlacar && setConfirmarPlacar(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: "400px", background: "rgba(18,18,18,0.99)", border: "1px solid rgba(255,193,7,0.3)", borderRadius: "var(--radius-2xl)", padding: "var(--space-6)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", textAlign: "center" }}
            >
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
                <Icon icon={AlertTriangle} size={22} style={{ color: "var(--color-feedback-warning)" }} />
              </div>
              <h2 style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-lg)", fontWeight: 600, color: "white" }}>
                Registrar placar?
              </h2>
              <p style={{ margin: "0 0 var(--space-5)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                O placar{" "}
                <strong style={{ color: "white" }}>
                  {partida.nomeTimeCasa} {golsCasa} × {golsVisitante} {partida.nomeTimeVisitante}
                </strong>{" "}
                será registrado e a partida encerrada. <strong style={{ color: "white" }}>Não será possível alterar depois.</strong>
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
                <Button variant="ghost" onClick={() => setConfirmarPlacar(false)} disabled={salvandoPlacar}>
                  Cancelar
                </Button>
                <Button variant="primary" onClick={handleRegistrarPlacar} loading={salvandoPlacar} style={{ minWidth: "150px" }}>
                  Confirmar e encerrar
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.main>
  );
}
