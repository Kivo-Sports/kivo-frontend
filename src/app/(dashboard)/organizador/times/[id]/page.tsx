"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  CheckCircle, XCircle, AlertTriangle,
  Trophy, Calendar, Users, MapPin, Clock, Pencil, Swords, History, X,
} from "lucide-react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import { FormField } from "@/components/molecules/FormField";
import { EsporteSelect } from "@/components/molecules/EsporteSelect";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { Icon as IconifyIcon } from "@iconify/react";
import { useToast } from "@/components/atoms/Toast";
import { fadeInUp, getFadeTransition, containerVariants, itemVariants } from "@/lib/motion";
import {
  useObterTimePorIdQuery,
  useAtualizarTimeMutation,
  useToggleStatusTimeMutation,
} from "@/store/api/timeApi";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import { useListarJogosQuery, useObterChaveamentoQuery } from "@/store/api/partidaApi";
import type { TimeFormValues, TimeResponse } from "@/types/time";
import type { CampeonatoResponse } from "@/types/campeonato";

// ─── Dados ───────────────────────────────────────────────────────────────────

const estadosBrasileiros: ReadonlyArray<{ sigla: string; nome: string }> = [
  { sigla: "AC", nome: "Acre" }, { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" }, { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" }, { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" }, { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" }, { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" }, { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" }, { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" }, { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" }, { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" }, { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" }, { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" }, { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" }, { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];
const BR_STATE_CODES = estadosBrasileiros.map((estado) => estado.sigla);
const TEAM_NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9' .-]+$/;
const CITY_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

const CAMP_STATUS: Record<string, { label: string; color: string; border: string; bg: string }> = {
  InscricoesAbertas: { label: "Inscrições Abertas", color: "var(--color-brand-primary)", border: "rgba(0,230,118,0.3)", bg: "rgba(0,230,118,0.08)" },
  EmAndamento:       { label: "Em Andamento",       color: "#60a5fa",                    border: "rgba(96,165,250,0.3)", bg: "rgba(96,165,250,0.08)" },
  Finalizado:        { label: "Finalizado",          color: "var(--color-text-secondary)", border: "rgba(255,255,255,0.1)", bg: "rgba(255,255,255,0.04)" },
  Cancelado:         { label: "Cancelado",           color: "var(--color-feedback-danger)", border: "rgba(255,72,68,0.3)", bg: "rgba(255,72,68,0.08)" },
  Rascunho:          { label: "Rascunho",            color: "var(--color-text-muted)",    border: "rgba(255,255,255,0.08)", bg: "rgba(255,255,255,0.03)" },
};

const editarTimeSchema = z.object({
  nome: z.string()
    .trim()
    .min(3, "Mínimo 3 caracteres")
    .max(80, "Máximo 80 caracteres")
    .regex(TEAM_NAME_REGEX, "Use apenas letras, números, espaços, ponto, apóstrofo ou hífen"),
  cidade: z.string()
    .trim()
    .min(2, "Mínimo 2 caracteres")
    .max(80, "Máximo 80 caracteres")
    .regex(CITY_REGEX, "Use apenas letras, espaços, apóstrofo ou hífen"),
  estado: z.string()
    .trim()
    .length(2, "Selecione um estado")
    .refine((value) => BR_STATE_CODES.includes(value), "Estado inválido"),
  esporteId: z.string().uuid("Selecione um esporte"),
});

function extrairMensagemErroApi(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback;
  const apiError = error as FetchBaseQueryError & { data?: unknown };
  const data = apiError.data;
  if (typeof data === "string" && data.length > 0) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const msg = d.message ?? d.mensagem ?? d.title ?? d.error;
    if (typeof msg === "string" && msg.length > 0) return msg;

    const errors = d.errors;
    if (errors && typeof errors === "object") {
      const primeiraLista = Object.values(errors as Record<string, unknown>).find((value) =>
        Array.isArray(value) && value.length > 0,
      );
      if (Array.isArray(primeiraLista) && typeof primeiraLista[0] === "string") {
        return primeiraLista[0];
      }
    }
  }
  return fallback;
}

function formatarTamanhoArquivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function validarLogo(arquivo: File): string | null {
  const tiposPermitidos = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
  if (!tiposPermitidos.includes(arquivo.type)) return "Formato inválido. Use PNG, JPG/JPEG ou WEBP.";
  if (arquivo.size > MAX_LOGO_SIZE_BYTES) return "Logo deve ter no máximo 5 MB.";
  return null;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatusTag({ status }: { status: string }) {
  const cfg = CAMP_STATUS[status] ?? CAMP_STATUS.Rascunho;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: "var(--radius-full)",
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        background: cfg.bg,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {cfg.label}
    </span>
  );
}

function CampeonatoItem({ camp }: { camp: CampeonatoResponse }) {
  return (
    <Link href={`/campeonatos/${camp.id}`} style={{ textDecoration: "none" }}>
      <motion.div
        variants={itemVariants}
        style={{
          padding: "var(--space-3)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.025)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-2)",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,230,118,0.06)"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.25)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
      >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
          <Avatar name={camp.nome} src={camp.logoUrl || undefined} size="sm" />
          <p style={{ margin: 0, fontWeight: 600, color: "white", fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {camp.nome}
          </p>
        </div>
        <StatusTag status={camp.status} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
          <Icon icon={Calendar} size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            {new Date(camp.dataInicio).toLocaleDateString("pt-BR")}
            {" → "}
            {new Date(camp.dataFim).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
          <Icon icon={Users} size={11} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            {camp.totalTimes} {camp.totalTimes === 1 ? "time" : "times"}
          </p>
        </div>
      </div>
      </motion.div>
    </Link>
  );
}

function SectionLabel({ dot, label, count }: { dot: string; label: string; count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: dot, flexShrink: 0 }} />
      <p style={{ margin: 0, fontSize: "var(--text-xs)", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 700, color: "var(--color-text-secondary)" }}>
        {label}
      </p>
      {count > 0 && (
        <span
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            minWidth: 18, height: 18,
            borderRadius: "var(--radius-full)",
            background: "rgba(255,255,255,0.08)",
            color: "var(--color-text-secondary)",
            fontSize: "var(--text-xs)",
            fontWeight: 700,
            padding: "0 5px",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyGroup({ label }: { label: string }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: "var(--text-sm)",
        color: "var(--color-text-muted)",
        padding: "var(--space-3)",
        textAlign: "center",
        borderRadius: "var(--radius-lg)",
        background: "rgba(255,255,255,0.02)",
        border: "1px dashed rgba(255,255,255,0.07)",
      }}
    >
      {label}
    </p>
  );
}

// ─── Jogos do time ─────────────────────────────────────────────────────────────

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

function formatarDataJogo(dataHora: string | null): string | null {
  if (!dataHora) return null;
  const data = new Date(dataHora);
  if (Number.isNaN(data.getTime())) return null;
  const dia = data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  const hora = data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const temHora = data.getHours() !== 0 || data.getMinutes() !== 0;
  return temHora ? `${dia} · ${hora}` : dia;
}

function TimeJogoRow({ jogo }: { jogo: TimeJogoView }) {
  const resultado = !jogo.finalizado
    ? null
    : jogo.golsTime > jogo.golsAdversario
      ? "V"
      : jogo.golsTime < jogo.golsAdversario
        ? "D"
        : "E";
  const corResultado =
    resultado === "V" ? "var(--color-feedback-success)"
      : resultado === "D" ? "var(--color-feedback-danger)"
        : resultado === "E" ? "var(--color-feedback-warning)"
          : "var(--color-text-muted)";
  const dataFormatada = formatarDataJogo(jogo.dataHora);

  return (
    <Link href={`/jogos/${jogo.id}`} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          padding: "var(--space-3)",
          borderRadius: "var(--radius-lg)",
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,230,118,0.06)"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.25)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
      >
      <span
        style={{
          flexShrink: 0,
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          padding: "3px 7px",
          borderRadius: "var(--radius-full)",
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
          <span
            style={{
              width: 22, height: 22, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "11px", fontWeight: 800,
              color: corResultado,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${corResultado}`,
            }}
          >
            {resultado}
          </span>
        </div>
      ) : (
        <span style={{ flexShrink: 0, fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)" }}>
          A jogar
        </span>
      )}
      </div>
    </Link>
  );
}

function TimeJogosCampeonato({
  campeonato,
  timeNome,
  filtro,
}: {
  campeonato: CampeonatoResponse;
  timeNome: string;
  filtro: "proximos" | "passados";
}) {
  const usaPontos = campeonato.formatoCampeonato === "PontosCorridos" || campeonato.formatoCampeonato === "Hibrido";
  const usaMata = campeonato.formatoCampeonato === "MataMata" || campeonato.formatoCampeonato === "Hibrido";

  const { data: jogos = [], isLoading: carregandoJogos } = useListarJogosQuery(campeonato.id, { skip: !usaPontos });
  const { data: chaveamento = [], isLoading: carregandoChave } = useObterChaveamentoQuery(campeonato.id, { skip: !usaMata });

  const todos: TimeJogoView[] = [];
  for (const j of jogos) {
    if (j.nomeTimeCasa === timeNome || j.nomeTimeVisitante === timeNome) {
      const mandante = j.nomeTimeCasa === timeNome;
      todos.push({
        id: j.id,
        adversario: mandante ? j.nomeTimeVisitante : j.nomeTimeCasa,
        logoAdversario: mandante ? j.logoTimeVisitante : j.logoTimeCasa,
        golsTime: mandante ? j.golsTimeCasa : j.golsTimeVisitante,
        golsAdversario: mandante ? j.golsTimeVisitante : j.golsTimeCasa,
        finalizado: j.finalizado,
        mandante,
        etiqueta: `Rodada ${j.rodada}`,
        dataHora: j.dataHora,
      });
    }
  }
  for (const fase of chaveamento) {
    for (const p of fase.partidas) {
      if (p.timeCasa === timeNome || p.timeVisitante === timeNome) {
        const mandante = p.timeCasa === timeNome;
        todos.push({
          id: p.id,
          adversario: mandante ? p.timeVisitante : p.timeCasa,
          logoAdversario: mandante ? p.logoVisitante : p.logoCasa,
          golsTime: mandante ? p.golsCasa : p.golsVisitante,
          golsAdversario: mandante ? p.golsVisitante : p.golsCasa,
          finalizado: p.finalizado,
          mandante,
          etiqueta: fase.fase,
          dataHora: p.dataHora,
        });
      }
    }
  }

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
        <p style={{ margin: 0, padding: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
          Carregando jogos...
        </p>
      ) : filtrados.length === 0 ? (
        <EmptyGroup label={filtro === "passados" ? "Nenhum jogo disputado ainda" : "Nenhum jogo agendado"} />
      ) : (
        filtrados.map((j) => <TimeJogoRow key={j.id} jogo={j} />)
      )}
    </div>
  );
}

// ─── Modal: Editar Time ─────────────────────────────────────────────────────────

function EditarTimeModal({ time, onClose }: { time: TimeResponse; onClose: () => void }) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [atualizarTime, { isLoading: isSaving }] = useAtualizarTimeMutation();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isDragOverLogo, setIsDragOverLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<TimeFormValues>({
    resolver: zodResolver(editarTimeSchema),
    defaultValues: { nome: time.nome, cidade: time.cidade, estado: time.estado, esporteId: time.esporteId },
  });

  const esporteValue = watch("esporteId");

  const selectStyles = [
    "h-12", "w-full", "rounded-[var(--radius-md)]", "border",
    "bg-(--color-bg-input)", "px-3", "text-sm", "text-(--color-text-primary)",
    "outline-none", "transition-all", "duration-200", "focus-visible:ring-2",
    errors.estado?.message
      ? "border-(--color-feedback-danger) focus-visible:border-(--color-feedback-danger) focus-visible:ring-(--color-feedback-danger-bg)"
      : "border-(--color-border-default) focus-visible:border-(--color-border-focus) focus-visible:ring-(--color-feedback-success-bg)",
  ].filter(Boolean).join(" ");

  const selecionarLogo = (arquivo: File | null): void => {
    if (!arquivo) return;
    const erro = validarLogo(arquivo);
    if (erro) {
      setLogoFile(null);
      setLogoError(erro);
      return;
    }
    setLogoFile(arquivo);
    setLogoError(null);
  };

  const onSubmit = async (values: TimeFormValues) => {
    try {
      await atualizarTime({ id: time.id, ...values, logo: logoFile ?? undefined }).unwrap();
      toastSuccess("Time atualizado com sucesso!");
      onClose();
    } catch (error) {
      toastError(extrairMensagemErroApi(error, "Não foi possível salvar as alterações."), "Erro ao atualizar");
    }
  };

  const canSave = isDirty || Boolean(logoFile);

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "440px", background: "rgba(18,18,18,0.99)", border: "1px solid rgba(0,230,118,0.25)", borderRadius: "var(--radius-2xl)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", maxHeight: "85vh", overflow: "hidden" }}
      >
        <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-brand-primary)" }}>
            Editar Time
          </p>
          <button
            onClick={onClose}
            style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}
          >
            <Icon icon={X} size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: "flex", flexDirection: "column", minHeight: 0, flex: 1 }}>
          <div style={{ padding: "var(--space-5)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <FormField
              label="Nome do time"
              placeholder="ex: Curitiba Bears"
              error={errors.nome?.message}
              {...register("nome")}
            />
            <FormField
              label="Cidade"
              placeholder="ex: Curitiba"
              error={errors.cidade?.message}
              {...register("cidade")}
            />

            <div>
              <label htmlFor="estado" className="mb-2 inline-block text-sm font-semibold text-(--color-text-primary)">
                Estado
              </label>
              <select id="estado" aria-invalid={Boolean(errors.estado?.message)} className={selectStyles} {...register("estado")}>
                <option value="" disabled>Estado</option>
                {estadosBrasileiros.map((e) => (
                  <option key={e.sigla} value={e.sigla}>{e.sigla} – {e.nome}</option>
                ))}
              </select>
              {errors.estado?.message && (
                <p role="alert" style={{ marginTop: "var(--space-2)", marginBottom: 0, fontSize: "var(--text-sm)", color: "var(--color-feedback-danger)" }}>
                  {errors.estado.message}
                </p>
              )}
            </div>

            <EsporteSelect
              value={esporteValue}
              onChange={(id) => setValue("esporteId", id, { shouldValidate: true, shouldDirty: true })}
              error={errors.esporteId?.message}
            />

            <div>
              <label htmlFor="logo-editar" className="mb-2 inline-block text-sm font-semibold text-(--color-text-primary)">
                Atualizar logo <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
              </label>
              {time.logoUrl && !logoFile && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                  <Avatar name={time.nome} src={time.logoUrl} size="sm" />
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Logo atual</span>
                </div>
              )}
              <input
                ref={logoInputRef}
                id="logo-editar"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => selecionarLogo(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />
              <div
                role="button"
                tabIndex={0}
                onClick={() => logoInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    logoInputRef.current?.click();
                  }
                }}
                onDragOver={(event) => { event.preventDefault(); setIsDragOverLogo(true); }}
                onDragLeave={(event) => { event.preventDefault(); setIsDragOverLogo(false); }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragOverLogo(false);
                  selecionarLogo(event.dataTransfer.files?.[0] ?? null);
                }}
                style={{
                  borderRadius: "var(--radius-md)",
                  border: logoError
                    ? "1px dashed var(--color-feedback-danger)"
                    : isDragOverLogo
                      ? "1px dashed var(--color-brand-primary)"
                      : "1px dashed var(--color-border-default)",
                  background: isDragOverLogo ? "rgba(0, 230, 118, 0.08)" : "rgba(255,255,255,0.03)",
                  padding: "var(--space-3)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  outline: "none",
                  display: "grid",
                  gap: "4px",
                }}
              >
                <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>
                  {logoFile ? "Novo arquivo selecionado" : time.logoUrl ? "Trocar logo" : "Clique ou arraste a logo aqui"}
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  {logoFile ? `${logoFile.name} (${formatarTamanhoArquivo(logoFile.size)})` : "PNG, JPG/JPEG ou WEBP até 5 MB"}
                </p>
              </div>
              {logoError && (
                <p role="alert" style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-xs)", color: "var(--color-feedback-danger)" }}>
                  {logoError}
                </p>
              )}
            </div>
          </div>

          <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: "var(--space-3)", flexShrink: 0 }}>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving} fullWidth>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={isSaving} disabled={!canSave || isSaving} fullWidth>
              Salvar alterações
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────

type AbaTime = "campeonatos" | "proximos" | "passados";

export default function DetalheTimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { success: toastSuccess, error: toastError } = useToast();
  const [isLogoModalOpen, setIsLogoModalOpen]       = useState(false);
  const [showDesativarModal, setShowDesativarModal] = useState(false);
  const [modalEditar, setModalEditar]               = useState(false);
  const [aba, setAba]                               = useState<AbaTime>("campeonatos");

  const { data: time, isLoading, isError } = useObterTimePorIdQuery(id);
  const [toggleStatus, { isLoading: isToggling }]  = useToggleStatusTimeMutation();
  const { data: todosCampeonatos = [] } = useListarCampeonatosQuery();

  const campeonatosDoTime     = todosCampeonatos.filter((c) => c.times?.includes(id) ?? false);
  const campeonatosAtivos     = campeonatosDoTime.filter((c) => c.status === "InscricoesAbertas" || c.status === "EmAndamento");
  const campeonatosEncerrados = campeonatosDoTime.filter((c) => c.status === "Finalizado" || c.status === "Cancelado");
  const campeonatosEmAndamento = campeonatosDoTime.filter((c) => c.status === "EmAndamento");
  const campeonatosComHistorico = campeonatosDoTime.filter((c) => c.status === "EmAndamento" || c.status === "Finalizado");

  const handleToggleStatus = () => {
    if (time?.ativo) {
      setShowDesativarModal(true);
    } else {
      void handleReativar();
    }
  };

  const handleReativar = async () => {
    try {
      await toggleStatus(id).unwrap();
      toastSuccess("Time reativado!");
    } catch (error) {
      toastError(extrairMensagemErroApi(error, "Não foi possível reativar o time."), "Erro");
    }
  };

  const confirmarDesativar = async () => {
    try {
      await toggleStatus(id).unwrap();
      toastSuccess("Time desativado.");
      setShowDesativarModal(false);
    } catch (error) {
      toastError(extrairMensagemErroApi(error, "Não foi possível desativar o time."), "Erro");
    }
  };

  // ─── Loading / Error ─────────────────────────────────────────────────────

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
        <Link href="/organizador/times" style={{ color: "var(--color-brand-primary)", textDecoration: "none", fontSize: "var(--text-sm)" }}>
          Voltar para times
        </Link>
      </main>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  const TABS: { key: AbaTime; label: string; icon: typeof Trophy }[] = [
    { key: "campeonatos", label: "Campeonatos",    icon: Trophy },
    { key: "proximos",    label: "Próximos jogos", icon: Swords },
    { key: "passados",    label: "Jogos passados", icon: History },
  ];

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "1100px", margin: "0 auto", padding: "var(--space-6) var(--space-4)" }}
    >
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: "var(--space-5)" }}
      >
        <BotaoVoltar fallbackHref="/organizador/times" />
      </motion.div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.04 }}
        style={{ marginBottom: "var(--space-6)" }}
      >
        <Card
          padding="lg"
          className="time-hero-card"
          style={{
            background: "linear-gradient(160deg, rgba(18,18,18,0.98), rgba(10,10,10,0.99))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
          }}
        >
          <div data-time-hero style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(true)}
              style={{ background: "none", border: "none", padding: 0, cursor: "zoom-in", borderRadius: "999px", flexShrink: 0 }}
              aria-label="Ampliar logo do time"
            >
              <Avatar name={time.nome} src={time.logoUrl || undefined} size="lg" />
            </button>

            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-2)" }}>
                <h1 style={{ margin: 0, fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 700, color: "white", lineHeight: 1.2 }}>
                  {time.nome}
                </h1>
                <Badge variant={time.ativo ? "success" : "danger"}>
                  {time.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  <Icon icon={MapPin} size={12} style={{ color: "var(--color-text-muted)" }} />
                  {time.cidade} · {time.estado}
                </span>
                {time.esporteNome && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(0,230,118,0.06)", border: "1px solid rgba(0,230,118,0.2)", fontSize: "var(--text-xs)", color: "var(--color-brand-primary)" }}>
                    {time.esporteIcone && <IconifyIcon icon={time.esporteIcone} width={13} height={13} />}
                    {time.esporteNome}
                  </span>
                )}
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  <Icon icon={Clock} size={12} style={{ color: "var(--color-text-muted)" }} />
                  Desde {new Date(time.criadoEm).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div
              data-time-hero-stats
              style={{
                display: "flex", alignItems: "stretch", gap: "var(--space-4)",
                flexShrink: 0,
                padding: "var(--space-3) var(--space-4)",
                borderRadius: "var(--radius-xl)",
                background: "rgba(255,255,255,0.045)",
                border: "1px solid rgba(255,255,255,0.09)",
              }}
            >
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-brand-primary)", lineHeight: 1 }}>
                  {campeonatosAtivos.length}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Ativos
                </p>
              </div>
              <div data-time-stat-divider style={{ width: 1, background: "rgba(255,255,255,0.1)", alignSelf: "stretch" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 700, color: "white", lineHeight: 1 }}>
                  {campeonatosDoTime.length}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Total
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div
        data-detalhes-grid
        style={{ display: "grid", gridTemplateColumns: "minmax(0,4fr) minmax(0,8fr)", gap: "var(--space-6)", alignItems: "start" }}
      >
        {/* ── Esquerda: Ações ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
        >
          <Card
            padding="md"
            style={{
              background: "linear-gradient(160deg, rgba(18,18,18,0.98), rgba(10,10,10,0.99))",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            }}
          >
            <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-xs)", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Ações
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <Button
                variant="primary"
                fullWidth
                onClick={() => setModalEditar(true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)" }}
              >
                <Icon icon={Pencil} size={14} />
                Editar informações
              </Button>
              <Button
                variant="ghost"
                fullWidth
                loading={isToggling && !time.ativo}
                onClick={handleToggleStatus}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)",
                  color: time.ativo ? "var(--color-feedback-warning)" : "var(--color-feedback-success)",
                  border: `1px solid ${time.ativo ? "rgba(255,193,7,0.25)" : "rgba(0,230,118,0.25)"}`,
                }}
              >
                <Icon icon={time.ativo ? XCircle : CheckCircle} size={14} />
                {time.ativo ? "Desativar time" : "Reativar time"}
              </Button>
            </div>
          </Card>

          {/* Resumo */}
          <Card
            padding="md"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-xl)" }}
          >
            <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-xs)", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Resumo
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Em andamento</span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "#60a5fa" }}>{campeonatosEmAndamento.length}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Encerrados</span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-secondary)" }}>{campeonatosEncerrados.length}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Direita: Abas ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card
            padding="lg"
            style={{
              background: "linear-gradient(160deg, rgba(15,15,15,0.98), rgba(8,8,8,0.99))",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            }}
          >
            {/* Seletor de abas */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "var(--space-5)", padding: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {TABS.map((t) => {
                const ativo = aba === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setAba(t.key)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                      padding: "var(--space-2) var(--space-1)", borderRadius: "var(--radius-md)", border: "none", cursor: "pointer",
                      fontSize: "var(--text-sm)", fontWeight: 600,
                      background: ativo ? "rgba(0,230,118,0.12)" : "transparent",
                      color: ativo ? "var(--color-brand-primary)" : "var(--color-text-muted)",
                      boxShadow: ativo ? "0 1px 8px rgba(0,230,118,0.12)" : "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <Icon icon={t.icon} size={14} />
                    <span data-tab-label>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Aba: Campeonatos */}
            {aba === "campeonatos" && (
              <>
                <div style={{ marginBottom: "var(--space-5)" }}>
                  <SectionLabel dot="var(--color-brand-primary)" label="Participando" count={campeonatosAtivos.length} />
                  {campeonatosAtivos.length === 0 ? (
                    <EmptyGroup label="Nenhum campeonato ativo no momento" />
                  ) : (
                    <motion.div variants={containerVariants} initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      {campeonatosAtivos.map((c) => <CampeonatoItem key={c.id} camp={c} />)}
                    </motion.div>
                  )}
                </div>

                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: "var(--space-5)" }} />

                <div>
                  <SectionLabel dot="var(--color-text-muted)" label="Histórico" count={campeonatosEncerrados.length} />
                  {campeonatosEncerrados.length === 0 ? (
                    <EmptyGroup label="Nenhum campeonato encerrado registrado" />
                  ) : (
                    <motion.div variants={containerVariants} initial="initial" animate="animate" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      {campeonatosEncerrados.map((c) => <CampeonatoItem key={c.id} camp={c} />)}
                    </motion.div>
                  )}
                </div>
              </>
            )}

            {/* Aba: Próximos jogos */}
            {aba === "proximos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                {campeonatosEmAndamento.length === 0 ? (
                  <EmptyGroup label="Este time não tem jogos agendados no momento" />
                ) : (
                  campeonatosEmAndamento.map((c) => (
                    <TimeJogosCampeonato key={c.id} campeonato={c} timeNome={time.nome} filtro="proximos" />
                  ))
                )}
              </div>
            )}

            {/* Aba: Jogos passados */}
            {aba === "passados" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                {campeonatosComHistorico.length === 0 ? (
                  <EmptyGroup label="Este time ainda não disputou nenhum jogo" />
                ) : (
                  campeonatosComHistorico.map((c) => (
                    <TimeJogosCampeonato key={c.id} campeonato={c} timeNome={time.nome} filtro="passados" />
                  ))
                )}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          [data-detalhes-grid] {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .time-hero-card { padding: var(--space-4) !important; }
          [data-time-hero] { gap: var(--space-4) !important; }
          [data-time-hero-stats] {
            width: 100%;
            justify-content: space-around;
          }
          [data-tab-label] {
            display: none;
          }
        }
      `}</style>

      {/* ── Modais ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalEditar && (
          <EditarTimeModal time={time} onClose={() => setModalEditar(false)} />
        )}

        {showDesativarModal && (
          <div
            style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowDesativarModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: "100%", maxWidth: "400px", background: "rgba(18, 18, 18, 0.99)", border: "1px solid rgba(255, 193, 7, 0.3)", borderRadius: "var(--radius-2xl)", padding: "var(--space-6)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", textAlign: "center" }}
            >
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255, 193, 7, 0.1)", border: "1px solid rgba(255, 193, 7, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
                <Icon icon={AlertTriangle} size={22} style={{ color: "rgba(255, 193, 7, 0.9)" }} />
              </div>
              <h2 style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-lg)", fontWeight: 600, color: "white" }}>
                Desativar time?
              </h2>
              <p style={{ margin: "0 0 var(--space-5)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                <strong style={{ color: "white" }}>{time.nome}</strong> ficará inativo e não poderá participar de novos campeonatos. Você poderá reativar a qualquer momento.
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
                <Button variant="ghost" onClick={() => setShowDesativarModal(false)} disabled={isToggling}>
                  Cancelar
                </Button>
                <Button
                  variant="ghost"
                  loading={isToggling}
                  onClick={confirmarDesativar}
                  style={{ minWidth: "120px", color: "rgba(255, 193, 7, 0.9)", border: "1px solid rgba(255, 193, 7, 0.35)" }}
                >
                  Desativar time
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {isLogoModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visualizar logo do time"
          onClick={() => setIsLogoModalOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0, 0, 0, 0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)", backdropFilter: "blur(3px)" }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-3)" }}
          >
            <Avatar name={time.nome} src={time.logoUrl || undefined} size="2xl" />
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(false)}
              style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "white", borderRadius: "var(--radius-full)", padding: "6px 12px", fontSize: "var(--text-sm)", cursor: "pointer" }}
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </motion.main>
  );
}
