"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowLeft, CheckCircle, XCircle, AlertTriangle,
  Trophy, Calendar, Users, MapPin, Clock,
} from "lucide-react";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { FormField } from "@/components/molecules/FormField";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { useToast } from "@/components/atoms/Toast";
import { fadeInUp, getFadeTransition, containerVariants, itemVariants } from "@/lib/motion";
import {
  useObterTimePorIdQuery,
  useAtualizarTimeMutation,
  useToggleStatusTimeMutation,
} from "@/store/api/timeApi";
import { useListarCampeonatosQuery } from "@/store/api/campeonatoApi";
import type { TimeFormValues } from "@/types/time";
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
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flex: 1, minWidth: 0 }}>
          <Icon icon={Trophy} size={13} style={{ color: "var(--color-brand-primary)", flexShrink: 0 }} />
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          paddingTop: "var(--space-1)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Pontos:</span>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-feedback-success)" }}>
          V {camp.pontosVitoria}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.15)" }}>·</span>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-feedback-warning)" }}>
          E {camp.pontosEmpate}
        </span>
        <span style={{ fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.15)" }}>·</span>
        <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-muted)" }}>
          D {camp.pontosDerrota}
        </span>
      </div>
    </motion.div>
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

// ─── Página ───────────────────────────────────────────────────────────────────

export default function DetalheTimePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [isLogoModalOpen, setIsLogoModalOpen]         = useState(false);
  const [showDesativarModal, setShowDesativarModal]   = useState(false);

  const { data: time, isLoading, isError } = useObterTimePorIdQuery(id);
  const [atualizarTime, { isLoading: isSaving }]   = useAtualizarTimeMutation();
  const [toggleStatus, { isLoading: isToggling }]  = useToggleStatusTimeMutation();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isDragOverLogo, setIsDragOverLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const { data: todosCampeonatos = [] } = useListarCampeonatosQuery();

  const campeonatosDoTime    = todosCampeonatos.filter(c => c.times?.includes(id) ?? false);
  const campeonatosAtivos    = campeonatosDoTime.filter(c => c.status === "InscricoesAbertas" || c.status === "EmAndamento");
  const campeonatosEncerrados = campeonatosDoTime.filter(c => c.status === "Finalizado" || c.status === "Cancelado");

  const { register, handleSubmit, formState: { errors, isDirty }, reset } = useForm<TimeFormValues>({
    resolver: zodResolver(editarTimeSchema),
    defaultValues: {
      nome: "",
      cidade: "",
      estado: "",
    },
  });

  useEffect(() => {
    if (!time) return;
    reset({ nome: time.nome, cidade: time.cidade, estado: time.estado });
  }, [time, reset]);

  const selectStyles = [
    "h-12", "w-full", "rounded-[var(--radius-md)]", "border",
    "bg-(--color-bg-input)", "px-3", "text-sm", "text-(--color-text-primary)",
    "outline-none", "transition-all", "duration-200", "focus-visible:ring-2",
    errors.estado?.message
      ? "border-(--color-feedback-danger) focus-visible:border-(--color-feedback-danger) focus-visible:ring-(--color-feedback-danger-bg)"
      : "border-(--color-border-default) focus-visible:border-(--color-border-focus) focus-visible:ring-(--color-feedback-success-bg)",
  ].filter(Boolean).join(" ");

  const onSubmit = async (values: TimeFormValues) => {
    try {
      await atualizarTime({ id, ...values, logo: logoFile ?? undefined }).unwrap();
      toastSuccess("Time atualizado com sucesso!");
      reset(values);
      setLogoFile(null);
      setLogoError(null);
    } catch (error) {
      toastError(extrairMensagemErroApi(error, "Não foi possível salvar as alterações."), "Erro ao atualizar");
    }
  };

  const formatarTamanhoArquivo = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const validarLogo = (arquivo: File): string | null => {
    const tiposPermitidos = ["image/png", "image/jpeg", "image/webp", "image/jpg"];
    if (!tiposPermitidos.includes(arquivo.type)) {
      return "Formato inválido. Use PNG, JPG/JPEG ou WEBP.";
    }
    if (arquivo.size > MAX_LOGO_SIZE_BYTES) {
      return "Logo deve ter no máximo 5 MB.";
    }
    return null;
  };

  const selecionarLogo = (arquivo: File | null): void => {
    if (!arquivo) return;
    const erroValidacao = validarLogo(arquivo);
    if (erroValidacao) {
      setLogoFile(null);
      setLogoError(erroValidacao);
      return;
    }
    setLogoFile(arquivo);
    setLogoError(null);
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    selecionarLogo(event.target.files?.[0] ?? null);
  };

  const handleLogoDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragOverLogo(false);
    selecionarLogo(event.dataTransfer.files?.[0] ?? null);
  };

  const canSave = isDirty || Boolean(logoFile);

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
        <Link
          href="/organizador/times"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-2)",
            color: "var(--color-text-muted)",
            textDecoration: "none",
            fontSize: "var(--text-sm)",
            transition: "color 0.15s",
          }}
        >
          <Icon icon={ArrowLeft} size={14} />
          Voltar para times
        </Link>
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
          style={{
            background: "linear-gradient(145deg, rgba(0,230,118,0.14) 0%, rgba(0,0,0,0.65) 70%)",
            border: "1px solid rgba(0,230,118,0.2)",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(true)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                cursor: "zoom-in",
                borderRadius: "999px",
              }}
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                  <Icon icon={MapPin} size={13} style={{ color: "var(--color-text-muted)" }} />
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {time.cidade} · {time.estado}
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                  <Icon icon={Clock} size={13} style={{ color: "var(--color-text-muted)" }} />
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                    Desde {new Date(time.criadoEm).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: "flex", gap: "var(--space-5)", flexShrink: 0 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-brand-primary)", lineHeight: 1 }}>
                  {campeonatosAtivos.length}
                </p>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Ativos
                </p>
              </div>
              <div style={{ width: 1, background: "rgba(255,255,255,0.08)", alignSelf: "stretch" }} />
              <div style={{ textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: "var(--text-3xl)", fontWeight: 700, color: "white", lineHeight: 1 }}>
                  {campeonatosDoTime.length}
                </p>
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
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
        style={{ display: "grid", gridTemplateColumns: "minmax(0,5fr) minmax(0,7fr)", gap: "var(--space-6)", alignItems: "start" }}
      >
        {/* ── Esquerda: Formulário + Ações ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
        >
          {/* Formulário */}
          <Card
            padding="lg"
            style={{
              background: "linear-gradient(160deg, rgba(18,18,18,0.98), rgba(10,10,10,0.99))",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            }}
          >
            <p style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-sm)", fontWeight: 700, color: "white", letterSpacing: "0.04em" }}>
              Editar informações
            </p>

            <form onSubmit={handleSubmit(onSubmit)} style={{ display: "grid", gap: "var(--space-4)" }} noValidate>
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

              <div>
                <label htmlFor="logo" className="mb-2 inline-block text-sm font-semibold text-(--color-text-primary)">
                  Atualizar logo
                </label>
                <input
                  ref={logoInputRef}
                  id="logo"
                  name="logo"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
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
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragOverLogo(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setIsDragOverLogo(false);
                  }}
                  onDrop={handleLogoDrop}
                  aria-invalid={Boolean(logoError)}
                  style={{
                    borderRadius: "var(--radius-lg)",
                    border: logoError
                      ? "1px dashed var(--color-feedback-danger)"
                      : isDragOverLogo
                        ? "1px dashed var(--color-brand-primary)"
                        : "1px dashed var(--color-border-default)",
                    background: isDragOverLogo
                      ? "rgba(0, 230, 118, 0.08)"
                      : "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
                    padding: "var(--space-4)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    outline: "none",
                    display: "grid",
                    gap: "var(--space-2)",
                  }}
                >
                  <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>
                    {logoFile ? "Arquivo selecionado" : "Clique ou arraste uma nova logo aqui"}
                  </p>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {logoFile
                      ? `${logoFile.name} (${formatarTamanhoArquivo(logoFile.size)})`
                      : "PNG, JPG/JPEG ou WEBP até 5 MB"}
                  </p>
                </div>
                {logoError ? (
                  <p role="alert" style={{ marginTop: "var(--space-2)", marginBottom: 0, fontSize: "var(--text-sm)", color: "var(--color-feedback-danger)" }}>
                    {logoError}
                  </p>
                ) : null}
                <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  Envie uma nova imagem apenas se quiser substituir a logo atual.
                </p>
              </div>

              <div style={{ display: "grid", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                <Button type="submit" loading={isSaving} disabled={!canSave || isSaving} fullWidth>
                  {isSaving ? "Salvando..." : "Salvar alterações"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setLogoFile(null);
                    setLogoError(null);
                  }}
                  disabled={!canSave}
                  style={{
                    background: "none", border: "none",
                    cursor: canSave ? "pointer" : "default",
                    textAlign: "center",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                    opacity: canSave ? 1 : 0.4,
                    padding: "var(--space-2)",
                    transition: "color 0.15s",
                  }}
                >
                  Desfazer alterações
                </button>
              </div>
            </form>
          </Card>

          {/* Ações rápidas */}
          <Card
            padding="md"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--radius-xl)",
            }}
          >
            <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-xs)", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Ações
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
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
        </motion.div>

        {/* ── Direita: Campeonatos ──────────────────────────────────────── */}
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
            {/* Cabeçalho */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-3)",
                marginBottom: "var(--space-5)",
                paddingBottom: "var(--space-4)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  width: "2.25rem", height: "2.25rem", borderRadius: "var(--radius-lg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.2)", flexShrink: 0,
                }}
              >
                <Icon icon={Trophy} size={16} style={{ color: "var(--color-brand-primary)" }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "white" }}>
                  Campeonatos
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  Participações deste time em campeonatos
                </p>
              </div>
            </div>

            {/* Seção: Participando */}
            <div style={{ marginBottom: "var(--space-5)" }}>
              <SectionLabel dot="var(--color-brand-primary)" label="Participando" count={campeonatosAtivos.length} />
              {campeonatosAtivos.length === 0 ? (
                <EmptyGroup label="Nenhum campeonato ativo no momento" />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="initial"
                  animate="animate"
                  style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}
                >
                  {campeonatosAtivos.map((c) => (
                    <CampeonatoItem key={c.id} camp={c} />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Divisor */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: "var(--space-5)" }} />

            {/* Seção: Histórico */}
            <div>
              <SectionLabel dot="var(--color-text-muted)" label="Histórico" count={campeonatosEncerrados.length} />
              {campeonatosEncerrados.length === 0 ? (
                <EmptyGroup label="Nenhum campeonato encerrado registrado" />
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="initial"
                  animate="animate"
                  style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}
                >
                  {campeonatosEncerrados.map((c) => (
                    <CampeonatoItem key={c.id} camp={c} />
                  ))}
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          [data-detalhes-grid] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Modal de confirmação: Desativar time */}
      <AnimatePresence>
        {showDesativarModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "var(--space-4)",
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => setShowDesativarModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "400px",
                background: "rgba(18, 18, 18, 0.99)",
                border: "1px solid rgba(255, 193, 7, 0.3)",
                borderRadius: "var(--radius-2xl)",
                padding: "var(--space-6)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "48px", height: "48px",
                  borderRadius: "50%",
                  background: "rgba(255, 193, 7, 0.1)",
                  border: "1px solid rgba(255, 193, 7, 0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto var(--space-4)",
                }}
              >
                <Icon icon={AlertTriangle} size={22} style={{ color: "rgba(255, 193, 7, 0.9)" }} />
              </div>
              <h2 style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-lg)", fontWeight: 600, color: "white" }}>
                Desativar time?
              </h2>
              <p style={{ margin: "0 0 var(--space-5)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
                <strong style={{ color: "white" }}>{time.nome}</strong> ficará inativo e não poderá participar de novos campeonatos. Você poderá reativar a qualquer momento.
              </p>
              <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
                <Button
                  variant="ghost"
                  onClick={() => setShowDesativarModal(false)}
                  disabled={isToggling}
                >
                  Cancelar
                </Button>
                <Button
                  variant="ghost"
                  loading={isToggling}
                  onClick={confirmarDesativar}
                  style={{
                    minWidth: "120px",
                    color: "rgba(255, 193, 7, 0.9)",
                    border: "1px solid rgba(255, 193, 7, 0.35)",
                  }}
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
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-4)",
            backdropFilter: "blur(3px)",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "var(--space-3)",
            }}
          >
            <Avatar name={time.nome} src={time.logoUrl || undefined} size="2xl" />
            <button
              type="button"
              onClick={() => setIsLogoModalOpen(false)}
              style={{
                border: "1px solid rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                borderRadius: "var(--radius-full)",
                padding: "6px 12px",
                fontSize: "var(--text-sm)",
                cursor: "pointer",
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </motion.main>
  );
}
