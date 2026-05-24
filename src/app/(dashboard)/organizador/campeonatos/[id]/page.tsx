"use client";

import { use, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Calendar, Users,
  CheckCircle, XCircle, UserPlus, AlertTriangle,
  Search, X, Clock, Play, Lock, Bell,
  Activity, FileText, Award, Pencil, Trash2,
  Swords, BarChart3, GitFork, PlayCircle, ChevronRight, ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { Avatar } from "@/components/atoms/Avatar";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import { Spinner } from "@/components/atoms/Spinner";
import { Icon } from "@/components/atoms/Icon";
import { useToast } from "@/components/atoms/Toast";
import { containerVariants, fadeInUp, getFadeTransition, itemVariants } from "@/lib/motion";
import {
  useListarCampeonatosQuery,
  useAbrirInscricoesMutation,
  useIniciarCampeonatoMutation,
  useEditarCampeonatoMutation,
  useCancelarCampeonatoMutation,
  useRemoverTimeDoCampeonatoMutation,
  useConvidarTimeMutation,
  useListarTodosOsTimesQuery,
  useListarConvitesCampeonatoQuery,
} from "@/store/api/campeonatoApi";
import {
  useObterClassificacaoQuery,
  useObterChaveamentoQuery,
  useListarJogosQuery,
} from "@/store/api/partidaApi";
import { Chaveamento } from "@/components/organisms/Chaveamento";
import { FORMATO_CAMPEONATO, type CampeonatoResponse, type FormatoCampeonato } from "@/types/campeonato";

// Valida potência de 2 (2, 4, 8, 16…) — exigido para a fase de mata-mata
function ehPotenciaDeDois(n: number): boolean {
  return Number.isInteger(n) && n >= 2 && (n & (n - 1)) === 0;
}

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

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
import type { TimeResponse } from "@/types/time";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "danger" | "default" | "info" }> = {
  Rascunho:             { label: "Rascunho",              variant: "default" },
  InscricoesAbertas:    { label: "Inscrições Abertas",    variant: "success" },
  InscricoesEncerradas: { label: "Inscrições Encerradas", variant: "warning" },
  EmAndamento:          { label: "Em Andamento",          variant: "info"    },
  Finalizado:           { label: "Finalizado",            variant: "default" },
  Cancelado:            { label: "Cancelado",             variant: "danger"  },
};

// ─── Funcionalidades futuras ──────────────────────────────────────────────────

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Activity,  title: "Estatísticas",             desc: "Métricas detalhadas por time: gols, assistências, cartões." },
  { icon: FileText,  title: "Regulamento",              desc: "Publique as regras oficiais acessíveis a todos os times." },
  { icon: Award,     title: "Premiação",                desc: "Configure troféus e reconhecimentos para os melhores." },
  { icon: Bell,      title: "Notificações",             desc: "Avise os times sobre partidas, resultados e mudanças." },
];

// ─── Modal: Convidar Time ─────────────────────────────────────────────────────

function ConvidarTimeModal({ campeonato, onClose, convidadosIniciais }: { campeonato: CampeonatoResponse; onClose: () => void; convidadosIniciais: string[] }) {
  const [busca, setBusca]               = useState("");
  const [convidandoId, setConvidandoId] = useState<string | null>(null);
  const [convidados, setConvidados]     = useState<Set<string>>(() => new Set(convidadosIniciais));
  const { success: toastSuccess, error: toastError } = useToast();

  const { data: todosOsTimes = [], isLoading } = useListarTodosOsTimesQuery();
  const [convidarTime] = useConvidarTimeMutation();

  const timesFiltrados = todosOsTimes.filter(
    (t) => t.ativo && (busca === "" || t.nome.toLowerCase().includes(busca.toLowerCase()) || t.cidade.toLowerCase().includes(busca.toLowerCase()))
  );

  const handleConvidar = async (time: TimeResponse) => {
    setConvidandoId(time.id);
    try {
      await convidarTime({ campeonatoId: campeonato.id, timeId: time.id }).unwrap();
      setConvidados((prev) => new Set([...prev, time.id]));
      toastSuccess(`Convite enviado para ${time.nome}!`);
    } catch {
      toastError("Não foi possível enviar o convite. Tente novamente.", "Erro");
    } finally {
      setConvidandoId(null);
    }
  };

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
        style={{ width: "100%", maxWidth: "480px", background: "rgba(18,18,18,0.99)", border: "1px solid rgba(0,230,118,0.25)", borderRadius: "var(--radius-2xl)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", maxHeight: "80vh", overflow: "hidden" }}
      >
        <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <p style={{ margin: 0, fontSize: "var(--text-xs)", letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--color-brand-primary)" }}>
              Convidar Time
            </p>
            <h2 style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-lg)", fontWeight: 600, color: "white" }}>
              {campeonato.nome}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", transition: "all 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--color-text-muted)"; }}
          >
            <Icon icon={X} size={16} />
          </button>
        </div>

        <div style={{ padding: "var(--space-4) var(--space-5)", flexShrink: 0 }}>
          <div style={{ position: "relative" }}>
            <Icon icon={Search} size={14} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Buscar por nome ou cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ width: "100%", padding: "var(--space-2) var(--space-3) var(--space-2) calc(var(--space-3) + 22px)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", color: "white", fontSize: "var(--text-sm)", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,118,0.4)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
            />
          </div>
        </div>

        <div style={{ overflowY: "auto", flex: 1, padding: "0 var(--space-5) var(--space-4)" }}>
          {isLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-6)" }}>
              <Spinner size="md" ariaLabel="Carregando times" />
            </div>
          ) : timesFiltrados.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "var(--space-6)", fontSize: "var(--text-sm)" }}>
              {busca ? "Nenhum time encontrado." : "Nenhum time ativo disponível."}
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {timesFiltrados.map((time) => {
                const jaConvidado = convidados.has(time.id);
                return (
                  <div
                    key={time.id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: jaConvidado ? "rgba(0,230,118,0.04)" : "rgba(255,255,255,0.03)", border: `1px solid ${jaConvidado ? "rgba(0,230,118,0.15)" : "rgba(255,255,255,0.05)"}`, transition: "background 0.15s" }}
                    onMouseEnter={(e) => { if (!jaConvidado) e.currentTarget.style.background = "rgba(0,230,118,0.04)"; }}
                    onMouseLeave={(e) => { if (!jaConvidado) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", minWidth: 0 }}>
                      <Avatar name={time.nome} src={time.logoUrl || undefined} size="sm" />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 600, color: "white", fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{time.nome}</p>
                        <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{time.cidade} · {time.estado}</p>
                      </div>
                    </div>
                    {jaConvidado ? (
                      <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-feedback-success)", background: "color-mix(in srgb, var(--color-feedback-success) 12%, transparent)", border: "1px solid color-mix(in srgb, var(--color-feedback-success) 30%, transparent)" }}>
                        <Icon icon={CheckCircle} size={11} />
                        Convidado
                      </span>
                    ) : (
                      <Button variant="primary" size="sm" loading={convidandoId === time.id} onClick={() => handleConvidar(time)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
                        <Icon icon={UserPlus} size={13} />
                        Convidar
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Tipo compartilhado ───────────────────────────────────────────────────────

interface ParticipacaoDisplay {
  participacaoId: string;
  timeId: string;
  nomeTime: string;
  logoUrl: string | null;
  cidade: string;
  estado: string;
  convidadoEm: string;
  aceito: boolean | null;
}

// ─── Modal: Remover Time ──────────────────────────────────────────────────────

function RemoverTimeModal({ nomeTime, onConfirm, onClose, isLoading }: {
  nomeTime: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading: boolean;
}) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "400px", background: "rgba(18,18,18,0.99)", border: "1px solid rgba(255,72,68,0.3)", borderRadius: "var(--radius-2xl)", padding: "var(--space-6)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", textAlign: "center" }}
      >
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,72,68,0.1)", border: "1px solid rgba(255,72,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
          <Icon icon={Trash2} size={22} style={{ color: "var(--color-feedback-danger)" }} />
        </div>
        <h2 style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-lg)", fontWeight: 600, color: "white" }}>
          Remover time?
        </h2>
        <p style={{ margin: "0 0 var(--space-5)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          <strong style={{ color: "white" }}>{nomeTime}</strong> será removido do campeonato. O convite será cancelado.
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Voltar</Button>
          <Button variant="danger" onClick={onConfirm} loading={isLoading} style={{ minWidth: "120px" }}>
            Remover time
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Cancelar Campeonato ───────────────────────────────────────────────

function CancelarModal({ nome, onConfirm, onClose, isLoading }: { nome: string; onConfirm: () => void; onClose: () => void; isLoading: boolean }) {
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
        style={{ width: "100%", maxWidth: "400px", background: "rgba(18,18,18,0.99)", border: "1px solid rgba(255,72,68,0.3)", borderRadius: "var(--radius-2xl)", padding: "var(--space-6)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", textAlign: "center" }}
      >
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255,72,68,0.1)", border: "1px solid rgba(255,72,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-4)" }}>
          <Icon icon={AlertTriangle} size={22} style={{ color: "var(--color-feedback-danger)" }} />
        </div>
        <h2 style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-lg)", fontWeight: 600, color: "white" }}>
          Cancelar campeonato?
        </h2>
        <p style={{ margin: "0 0 var(--space-5)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
          <strong style={{ color: "white" }}>{nome}</strong> será marcado como cancelado. Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Voltar</Button>
          <Button variant="danger" onClick={onConfirm} loading={isLoading} style={{ minWidth: "140px" }}>
            Cancelar campeonato
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Editar Campeonato ─────────────────────────────────────────────────

function EditarCampeonatoModal({ campeonato, onClose }: { campeonato: CampeonatoResponse; onClose: () => void }) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [editarCampeonato, { isLoading }] = useEditarCampeonatoMutation();

  const [nome, setNome] = useState(campeonato.nome);
  const [dataInicio, setDataInicio] = useState(campeonato.dataInicio.slice(0, 10));
  const [dataFim, setDataFim] = useState(campeonato.dataFim.slice(0, 10));
  const [pVitoria, setPVitoria] = useState(String(campeonato.pontosVitoria));
  const [pEmpate, setPEmpate] = useState(String(campeonato.pontosEmpate));
  const [pDerrota, setPDerrota] = useState(String(campeonato.pontosDerrota));
  const [formato, setFormato] = useState<FormatoCampeonato>(
    (["PontosCorridos", "MataMata", "Hibrido"].includes(campeonato.formatoCampeonato)
      ? campeonato.formatoCampeonato
      : "PontosCorridos") as FormatoCampeonato,
  );
  const [classificam, setClassificam] = useState(
    String(campeonato.quantidadeTimesClassificam > 0 ? campeonato.quantidadeTimesClassificam : 4),
  );

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isDragOverLogo, setIsDragOverLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  // Pontuação só se aplica a formatos com fase de pontos corridos
  const usaPontuacao = formato === "PontosCorridos" || formato === "Hibrido";

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

  const labelStyle = { margin: "0 0 4px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", display: "block" } as const;
  const inputStyle = {
    width: "100%",
    height: "38px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "var(--radius-md)",
    padding: "0 var(--space-3)",
    color: "white",
    fontSize: "var(--text-sm)",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const handleSalvar = async () => {
    if (nome.trim().length < 3) {
      toastError("O nome deve ter ao menos 3 caracteres.", "Dados inválidos");
      return;
    }
    if (!dataInicio || !dataFim || new Date(dataFim) <= new Date(dataInicio)) {
      toastError("A data de fim deve ser posterior à data de início.", "Dados inválidos");
      return;
    }
    const qtd = Number(classificam);
    if (formato === "Hibrido" && !ehPotenciaDeDois(qtd)) {
      toastError("Times que classificam deve ser uma potência de 2 (2, 4, 8, 16…).", "Dados inválidos");
      return;
    }
    try {
      await editarCampeonato({
        id: campeonato.id,
        nome: nome.trim(),
        dataInicio: new Date(dataInicio).toISOString(),
        dataFim: new Date(dataFim).toISOString(),
        pontosVitoria: usaPontuacao ? Number(pVitoria) || 0 : 0,
        pontosEmpate: usaPontuacao ? Number(pEmpate) || 0 : 0,
        pontosDerrota: usaPontuacao ? Number(pDerrota) || 0 : 0,
        formatoCampeonato: FORMATO_CAMPEONATO[formato].valor,
        quantidadeTimesClassificam: formato === "Hibrido" ? qtd : 0,
        logo: logoFile ?? undefined,
      }).unwrap();
      toastSuccess("Campeonato atualizado com sucesso!");
      onClose();
    } catch (err) {
      const msg =
        typeof err === "object" && err !== null && "data" in err && typeof (err as { data: unknown }).data === "string"
          ? (err as { data: string }).data
          : "Não foi possível salvar as alterações. Tente novamente.";
      toastError(msg, "Erro");
    }
  };

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
            Editar Campeonato
          </p>
          <button
            onClick={onClose}
            style={{ width: "28px", height: "28px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)" }}
          >
            <Icon icon={X} size={14} />
          </button>
        </div>

        <div style={{ padding: "var(--space-5)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div>
            <label style={labelStyle}>Nome</label>
            <input style={inputStyle} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div>
              <label style={labelStyle}>Data de início</label>
              <input type="date" style={inputStyle} value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Data de fim</label>
              <input type="date" style={inputStyle} value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Formato</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={formato}
              onChange={(e) => setFormato(e.target.value as FormatoCampeonato)}
            >
              {(Object.keys(FORMATO_CAMPEONATO) as FormatoCampeonato[]).map((key) => (
                <option key={key} value={key} style={{ background: "#121212" }}>
                  {FORMATO_CAMPEONATO[key].label}
                </option>
              ))}
            </select>
            <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
              {FORMATO_CAMPEONATO[formato].desc}
            </p>
          </div>

          {formato === "Hibrido" && (
            <div>
              <label style={labelStyle}>Times que classificam para o mata-mata</label>
              <input type="number" min={2} style={inputStyle} value={classificam} onChange={(e) => setClassificam(e.target.value)} />
              <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                Deve ser uma potência de 2 (2, 4, 8, 16…).
              </p>
            </div>
          )}

          {/* Pontuação — apenas para formatos com fase de pontos corridos */}
          {usaPontuacao && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)" }}>
              <div>
                <label style={labelStyle}>Vitória</label>
                <input type="number" min={0} style={inputStyle} value={pVitoria} onChange={(e) => setPVitoria(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Empate</label>
                <input type="number" min={0} style={inputStyle} value={pEmpate} onChange={(e) => setPEmpate(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Derrota</label>
                <input type="number" min={0} style={inputStyle} value={pDerrota} onChange={(e) => setPDerrota(e.target.value)} />
              </div>
            </div>
          )}

          {/* Upload de logo */}
          <div>
            <label htmlFor="editar-logo" style={{ ...labelStyle, display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Icon icon={ImageIcon} size={12} style={{ color: "var(--color-text-muted)" }} />
              Logo do campeonato (opcional)
            </label>
            {campeonato.logoUrl && !logoFile && (
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                <Avatar name={campeonato.nome} src={campeonato.logoUrl} size="sm" />
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>Logo atual</span>
              </div>
            )}
            <input
              ref={logoInputRef}
              id="editar-logo"
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
              aria-invalid={Boolean(logoError)}
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
                {logoFile ? "Novo arquivo selecionado" : campeonato.logoUrl ? "Trocar logo" : "Clique ou arraste a logo aqui"}
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                {logoFile
                  ? `${logoFile.name} (${formatarTamanhoArquivo(logoFile.size)})`
                  : "PNG, JPG/JPEG ou WEBP até 5 MB"}
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
          <Button variant="ghost" onClick={onClose} disabled={isLoading} fullWidth>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSalvar} loading={isLoading} fullWidth>
            Salvar alterações
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Página de detalhes ───────────────────────────────────────────────────────

export default function DetalhesCampeonatoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = use(params);
  const router   = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [modalConvidar, setModalConvidar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [modalEditar, setModalEditar]     = useState(false);
  const [logoAmpliada, setLogoAmpliada]   = useState(false);
  const [teamSearch, setTeamSearch]       = useState("");
  const [timeParaRemover, setTimeParaRemover] = useState<ParticipacaoDisplay | null>(null);
  const [aba, setAba]                     = useState<"times" | "tabela" | "jogos">("times");

  const { data: todos = [], isLoading }         = useListarCampeonatosQuery();
  const { data: todosOsTimes = [] }             = useListarTodosOsTimesQuery();
  const { data: convitesCampeonato = [] }       = useListarConvitesCampeonatoQuery(id);
  const [abrirInscricoes, { isLoading: isAbrindo }]          = useAbrirInscricoesMutation();
  const [iniciarCampeonato, { isLoading: isIniciando }]      = useIniciarCampeonatoMutation();
  const [cancelarCampeonato, { isLoading: isCancelando }]    = useCancelarCampeonatoMutation();
  const [removerTime,        { isLoading: isRemovendoTime }] = useRemoverTimeDoCampeonatoMutation();

  const campeonato = todos.find((c) => c.id === id) ?? null;

  const iniciado          = !!campeonato && ["EmAndamento", "Finalizado"].includes(campeonato.status);
  const temPontosCorridos = campeonato?.formatoCampeonato === "PontosCorridos" || campeonato?.formatoCampeonato === "Hibrido";
  const temMataMata       = campeonato?.formatoCampeonato === "MataMata" || campeonato?.formatoCampeonato === "Hibrido";

  const { data: classificacaoData = [], isFetching: carregandoClassificacao } = useObterClassificacaoQuery(id, {
    skip: !iniciado || !temPontosCorridos,
  });
  const { data: chaveamentoData = [], isFetching: carregandoChaveamento } = useObterChaveamentoQuery(id, {
    skip: !iniciado || !temMataMata,
  });
  const { data: jogosData = [], isError: erroJogos, isFetching: carregandoJogos } = useListarJogosQuery(id, {
    skip: !iniciado || !temPontosCorridos,
  });

  const participacoesDisplay = convitesCampeonato.map((convite) => {
    const t = todosOsTimes.find((x) => x.id === convite.timeId);
    const aceito =
      convite.statusParticipacao === "Aceito" ? true :
      convite.statusParticipacao === "Recusado" ? false : null;
    return {
      participacaoId: convite.participacaoId,
      timeId: convite.timeId,
      nomeTime: t?.nome ?? convite.nomeTime,
      logoUrl: t?.logoUrl ?? null,
      cidade: t?.cidade ?? "",
      estado: t?.estado ?? "",
      convidadoEm: convite.convidadoEm,
      aceito: aceito as boolean | null,
    };
  });

  const todosConvidadosIds = convitesCampeonato.map((c) => c.timeId);

  const participacoesBuscadas = participacoesDisplay.filter((p) =>
    teamSearch === "" ||
    p.nomeTime.toLowerCase().includes(teamSearch.toLowerCase()) ||
    p.cidade.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const handleAbrirInscricoes = async () => {
    if (!campeonato) return;
    try {
      await abrirInscricoes(campeonato.id).unwrap();
      toastSuccess("Inscrições abertas com sucesso!");
    } catch {
      toastError("Não foi possível abrir as inscrições. Tente novamente.", "Erro");
    }
  };

  const handleIniciarCampeonato = async () => {
    if (!campeonato) return;
    try {
      await iniciarCampeonato(campeonato.id).unwrap();
      toastSuccess("Campeonato iniciado! Gere a tabela de jogos para começar.");
    } catch (err) {
      const msg =
        typeof err === "object" && err !== null && "data" in err && typeof (err as { data: unknown }).data === "string"
          ? (err as { data: string }).data
          : "Não foi possível iniciar o campeonato. Tente novamente.";
      toastError(msg, "Erro");
    }
  };

  const handleConfirmarRemocaoTime = async () => {
    if (!campeonato || !timeParaRemover) return;
    try {
      await removerTime({ campeonatoId: campeonato.id, timeId: timeParaRemover.timeId }).unwrap();
      toastSuccess(`${timeParaRemover.nomeTime} foi removido do campeonato.`);
      setTimeParaRemover(null);
    } catch {
      toastError("Não foi possível remover o time. Tente novamente.", "Erro");
    }
  };

  const handleConfirmarCancelamento = async () => {
    if (!campeonato) return;
    try {
      await cancelarCampeonato(campeonato.id).unwrap();
      toastSuccess(`${campeonato.nome} foi cancelado.`);
      setModalCancelar(false);
      router.push("/organizador/campeonatos");
    } catch {
      toastError("Não foi possível cancelar. Tente novamente.", "Erro");
    }
  };

  // ─── Loading / not found ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <main style={{ minHeight: "55vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spinner size="lg" ariaLabel="Carregando campeonato" />
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

  const statusCfg  = STATUS_CONFIG[campeonato.status] ?? { label: campeonato.status, variant: "default" as const };
  const dataInicio = new Date(campeonato.dataInicio);
  const dataFim    = new Date(campeonato.dataFim);

  const diasParaInicio = Math.ceil((dataInicio.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const diasParaFim    = Math.ceil((dataFim.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  const contagem = (() => {
    switch (campeonato.status) {
      case "Rascunho":
      case "InscricoesAbertas":
      case "InscricoesEncerradas":
        return diasParaInicio > 0
          ? { valor: diasParaInicio, label: "Dias p/ início" }
          : { valor: null as null, label: "Iniciando" };
      case "EmAndamento":
        return diasParaFim > 0
          ? { valor: diasParaFim, label: "Dias p/ fim" }
          : { valor: null as null, label: "Encerrando" };
      case "Finalizado":
        return { valor: null as null, label: "Finalizado" };
      case "Cancelado":
        return { valor: null as null, label: "Cancelado" };
      default:
        return { valor: null as null, label: "—" };
    }
  })();
  const podeConvidar   = campeonato.status === "InscricoesAbertas";
  const podeAbrir      = campeonato.status === "Rascunho";
  const podeIniciar    = campeonato.status === "InscricoesAbertas";
  const podeEditar     = !["EmAndamento", "Finalizado", "Cancelado"].includes(campeonato.status);
  const podeCancelar   = !["Finalizado", "Cancelado"].includes(campeonato.status);
  const isClosed       = ["Finalizado", "Cancelado"].includes(campeonato.status);

  const formato = campeonato.formatoCampeonato;
  const mostraClassificacao = formato === "PontosCorridos" || formato === "Hibrido";
  const mostraChaveamento   = formato === "MataMata" || formato === "Hibrido";

  const NAV_GESTAO: { href: string; icon: LucideIcon; title: string; desc: string }[] = [
    { href: `/organizador/campeonatos/${id}/jogos`, icon: Swords, title: "Jogos & Placares", desc: "Gere a tabela de jogos e registre os placares das partidas." },
    ...(mostraClassificacao ? [{ href: `/organizador/campeonatos/${id}/classificacao`, icon: BarChart3, title: "Classificação", desc: "Acompanhe a pontuação e a posição de cada time." }] : []),
    ...(mostraChaveamento ? [{ href: `/organizador/campeonatos/${id}/chaveamento`, icon: GitFork, title: "Chaveamento", desc: "Visualize os confrontos da fase eliminatória." }] : []),
  ];

  const grpConfirmados = participacoesBuscadas.filter((p) => p.aceito === true);
  const grpPendentes   = participacoesBuscadas.filter((p) => p.aceito === null);
  const grpRecusados   = participacoesBuscadas.filter((p) => p.aceito === false);

  const mostrarTodos = campeonato.status === "InscricoesAbertas";

  const GRUPOS = [
    { key: "confirmados", label: "Confirmados", items: grpConfirmados, color: "var(--color-feedback-success)",  bg: "rgba(0,230,118,0.06)",  border: "rgba(0,230,118,0.18)",  icon: CheckCircle },
    ...(mostrarTodos ? [
      { key: "pendentes", label: "Pendentes",   items: grpPendentes,   color: "rgba(255,193,7,0.9)",            bg: "rgba(255,193,7,0.06)",  border: "rgba(255,193,7,0.2)",   icon: Clock       },
      { key: "recusados", label: "Recusados",   items: grpRecusados,   color: "var(--color-feedback-danger)",   bg: "rgba(255,72,68,0.06)",  border: "rgba(255,72,68,0.18)",  icon: XCircle     },
    ] : []),
  ].filter((g) => g.items.length > 0);

  // ─── Dados das abas (campeonato em andamento) ────────────────────────────
  const abaTabelaLabel = temMataMata && !temPontosCorridos ? "Chaveamento" : "Tabela";

  const proximosJogos: { id: string; casa: string; visitante: string; etiqueta: string }[] = [];
  if (temPontosCorridos) {
    for (const j of jogosData) {
      if (!j.finalizado) {
        proximosJogos.push({ id: j.id, casa: j.nomeTimeCasa, visitante: j.nomeTimeVisitante, etiqueta: `Rodada ${j.rodada}` });
      }
    }
  }
  if (temMataMata) {
    for (const fase of chaveamentoData) {
      for (const p of fase.partidas) {
        if (!p.finalizado && p.timeCasa !== "A definir" && p.timeVisitante !== "A definir") {
          proximosJogos.push({ id: p.id, casa: p.timeCasa, visitante: p.timeVisitante, etiqueta: fase.fase });
        }
      }
    }
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
        <BotaoVoltar fallbackHref="/organizador/campeonatos" label="Voltar para campeonatos" />
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
          className="camp-hero-card"
          style={{
            background: "linear-gradient(160deg, rgba(18,18,18,0.98), rgba(10,10,10,0.99))",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div data-camp-hero style={{ position: "relative", display: "flex", flexWrap: "wrap", gap: "var(--space-6)", alignItems: "center", justifyContent: "space-between" }}>
            {/* Identidade: logo + título */}
            <div data-camp-hero-id style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", flex: "1 1 320px", minWidth: 0 }}>
              <div
                {...(campeonato.logoUrl
                  ? {
                      role: "button" as const,
                      tabIndex: 0,
                      onClick: () => setLogoAmpliada(true),
                      onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setLogoAmpliada(true);
                        }
                      },
                      title: "Ampliar logo",
                    }
                  : {})}
                data-camp-logo
                style={{
                  width: "4.75rem", height: "4.75rem", borderRadius: "var(--radius-xl)",
                  background: campeonato.logoUrl
                    ? `center / cover no-repeat url("${campeonato.logoUrl}")`
                    : "linear-gradient(150deg, rgba(0,230,118,0.22), rgba(0,230,118,0.04))",
                  border: "1px solid rgba(0,230,118,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  overflow: "hidden",
                  cursor: campeonato.logoUrl ? "zoom-in" : "default",
                  outline: "none",
                  boxShadow: "0 0 0 4px rgba(0,230,118,0.08), 0 10px 28px rgba(0,230,118,0.2)",
                }}
              >
                {!campeonato.logoUrl && <Icon icon={Trophy} size={30} style={{ color: "var(--color-brand-primary)" }} />}
              </div>

              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: "clamp(1.4rem, 3vw, 2.1rem)", fontWeight: 700, color: "white", lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {campeonato.nome}
                </h1>

                {/* Status + Formato (destaque) */}
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
                  <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "var(--radius-full)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-brand-primary)", background: "rgba(0,230,118,0.14)", border: "1px solid rgba(0,230,118,0.35)", boxShadow: "0 2px 10px rgba(0,230,118,0.1)" }}>
                    <Icon icon={GitFork} size={13} />
                    {FORMATO_CAMPEONATO[campeonato.formatoCampeonato as FormatoCampeonato]?.label ?? campeonato.formatoCampeonato}
                  </span>
                </div>

                {/* Datas */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    <Icon icon={Calendar} size={12} style={{ color: "var(--color-text-muted)" }} />
                    {dataInicio.toLocaleDateString("pt-BR")} → {dataFim.toLocaleDateString("pt-BR")}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    <Icon icon={Clock} size={12} style={{ color: "var(--color-text-muted)" }} />
                    Criado em {new Date(campeonato.criadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>

            {/* Painel de stats */}
            <div
              data-camp-hero-stats
              style={{
                display: "flex",
                alignItems: "stretch",
                gap: "var(--space-5)",
                flexShrink: 0,
                padding: "var(--space-4) var(--space-5)",
                borderRadius: "var(--radius-xl)",
                background: "rgba(255,255,255,0.045)",
                border: "1px solid rgba(255,255,255,0.09)",
                backdropFilter: "blur(8px)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <Icon icon={Users} size={15} style={{ color: "rgba(0,230,118,0.6)" }} />
                <p style={{ margin: 0, fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--color-brand-primary)", lineHeight: 1 }}>
                  {campeonato.totalTimes}
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  Times
                </p>
              </div>

              <div data-camp-stat-divider style={{ width: 1, background: "rgba(255,255,255,0.1)", alignSelf: "stretch" }} />

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <Icon icon={Clock} size={15} style={{ color: "rgba(255,255,255,0.4)" }} />
                <p style={{ margin: 0, fontSize: "var(--text-3xl)", fontWeight: 700, color: contagem.valor != null ? "white" : "var(--color-text-muted)", lineHeight: 1 }}>
                  {contagem.valor ?? "—"}
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  {contagem.label}
                </p>
              </div>

              {/* Pontuação — só para formatos com fase de pontos corridos */}
              {mostraClassificacao && (
                <>
                  <div data-camp-stat-divider style={{ width: 1, background: "rgba(255,255,255,0.1)", alignSelf: "stretch" }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Icon icon={Award} size={15} style={{ color: "rgba(255,255,255,0.4)" }} />
                    <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-feedback-success)" }}>V {campeonato.pontosVitoria}</span>
                      <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                      <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-feedback-warning)" }}>E {campeonato.pontosEmpate}</span>
                      <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
                      <span style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--color-text-muted)" }}>D {campeonato.pontosDerrota}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                      Pontuação
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Main grid ────────────────────────────────────────────────────── */}
      <div
        data-camp-grid
        style={{ display: "grid", gridTemplateColumns: "minmax(0,5fr) minmax(0,7fr)", gap: "var(--space-6)", alignItems: "start" }}
      >
        {/* ── Esquerda: Ações + Gestão ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
        >
          {/* Ações */}
          <Card
            padding="md"
            style={{ background: "linear-gradient(160deg, rgba(18,18,18,0.98), rgba(10,10,10,0.99))", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "var(--radius-2xl)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}
          >
            <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-xs)", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Ações disponíveis
            </p>

            {/* Info: times confirmados — contexto antes das ações */}
            {campeonato.status === "InscricoesAbertas" && (() => {
              const MIN_TIMES = 8;
              const confirmados = participacoesDisplay.filter((p) => p.aceito === true).length;
              const faltam = Math.max(0, MIN_TIMES - confirmados);
              const progresso = Math.min(100, (confirmados / MIN_TIMES) * 100);
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Icon icon={Users} size={14} style={{ color: faltam === 0 ? "var(--color-feedback-success)" : "var(--color-text-muted)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Times confirmados</p>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: faltam === 0 ? "var(--color-feedback-success)" : "white" }}>
                        {confirmados}/{MIN_TIMES} confirmados
                        {faltam > 0 && (
                          <span style={{ fontWeight: 400, color: "rgba(255,193,7,0.85)", marginLeft: "6px" }}>
                            (faltam {faltam})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div style={{ height: "4px", borderRadius: "var(--radius-full)", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progresso}%`, borderRadius: "var(--radius-full)", background: faltam === 0 ? "var(--color-feedback-success)" : "rgba(255,193,7,0.7)", transition: "width 0.3s ease" }} />
                  </div>
                </div>
              );
            })()}

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {/* Abrir inscrições */}
              {podeAbrir && (
                <Button
                  variant="primary"
                  fullWidth
                  loading={isAbrindo}
                  onClick={handleAbrirInscricoes}
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)" }}
                >
                  <Icon icon={Play} size={14} />
                  Abrir Inscrições
                </Button>
              )}

              {/* Convidar time */}
              {podeConvidar && (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setModalConvidar(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)" }}
                >
                  <Icon icon={UserPlus} size={14} />
                  Convidar Time
                </Button>
              )}

              {/* Iniciar campeonato */}
              {podeIniciar && (
                <Button
                  variant="primary"
                  fullWidth
                  loading={isIniciando}
                  onClick={handleIniciarCampeonato}
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)" }}
                >
                  <Icon icon={PlayCircle} size={14} />
                  Iniciar Campeonato
                </Button>
              )}

              {/* Editar campeonato */}
              {podeEditar && (
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setModalEditar(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)" }}
                >
                  <Icon icon={Pencil} size={14} />
                  Editar campeonato
                </Button>
              )}

              {/* Encerrar campeonato — placeholder */}
              {campeonato.status === "EmAndamento" && (
                <Button
                  variant="ghost"
                  fullWidth
                  disabled
                  style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)", opacity: 0.45, cursor: "not-allowed" }}
                >
                  <Icon icon={Lock} size={14} />
                  Encerrar Campeonato
                  <span style={{ marginLeft: "auto", fontSize: "10px", background: "rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: "var(--radius-full)", letterSpacing: "0.05em" }}>
                    Em breve
                  </span>
                </Button>
              )}

              {/* Finalizado/Cancelado — read-only notice */}
              {isClosed && (
                <div style={{ padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    Este campeonato está encerrado e não aceita mais ações.
                  </p>
                </div>
              )}

              {/* Cancelar */}
              {podeCancelar && (
                <>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "var(--space-1) 0" }} />
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => setModalCancelar(true)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "var(--space-2)", color: "var(--color-feedback-danger)", border: "1px solid rgba(255,72,68,0.25)" }}
                  >
                    <Icon icon={XCircle} size={14} />
                    Cancelar campeonato
                  </Button>
                </>
              )}
            </div>
          </Card>

          {/* Gestão do campeonato */}
          <Card
            padding="md"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-2xl)" }}
          >
            <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-xs)", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Gestão do campeonato
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {NAV_GESTAO.map((item) => (
                <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "rgba(0,230,118,0.04)", border: "1px solid rgba(0,230,118,0.12)", transition: "all 0.15s", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,230,118,0.09)"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.35)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,230,118,0.04)"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.12)"; }}
                  >
                    <div style={{ width: "2rem", height: "2rem", borderRadius: "var(--radius-md)", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon icon={item.icon} size={15} style={{ color: "var(--color-brand-primary)" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>{item.title}</p>
                      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.4 }}>{item.desc}</p>
                    </div>
                    <Icon icon={ChevronRight} size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ── Direita: Times ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card
            padding="lg"
            style={{ background: "linear-gradient(160deg, rgba(15,15,15,0.98), rgba(8,8,8,0.99))", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "var(--radius-2xl)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}
          >
            {/* Seletor de abas — campeonato em andamento */}
            {iniciado && (
              <div style={{ display: "flex", gap: "4px", marginBottom: "var(--space-5)", padding: "4px", background: "rgba(255,255,255,0.03)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(255,255,255,0.06)" }}>
                {([
                  { key: "times" as const,  label: "Times",       icon: Users },
                  { key: "tabela" as const, label: abaTabelaLabel, icon: temMataMata && !temPontosCorridos ? GitFork : BarChart3 },
                  { key: "jogos" as const,  label: "Jogos",        icon: Swords },
                ]).map((t) => {
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
                      {t.label}
                    </button>
                  );
                })}
              </div>
            )}

            {(!iniciado || aba === "times") && (
            <>
            {/* Cabeçalho */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", marginBottom: "var(--space-4)", paddingBottom: "var(--space-4)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <div style={{ width: "2.25rem", height: "2.25rem", borderRadius: "var(--radius-lg)", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.2)", flexShrink: 0 }}>
                  <Icon icon={Users} size={16} style={{ color: "var(--color-brand-primary)" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "white" }}>Times participantes</p>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {participacoesDisplay.length === 0
                      ? "Nenhum time convidado ainda"
                      : (() => {
                          const c = participacoesDisplay.filter((p) => p.aceito === true).length;
                          const p = participacoesDisplay.filter((x) => x.aceito === null).length;
                          const r = participacoesDisplay.filter((x) => x.aceito === false).length;
                          return [
                            c > 0 && `${c} confirmado${c !== 1 ? "s" : ""}`,
                            mostrarTodos && p > 0 && `${p} pendente${p !== 1 ? "s" : ""}`,
                            mostrarTodos && r > 0 && `${r} recusado${r !== 1 ? "s" : ""}`,
                          ].filter(Boolean).join(" · ");
                        })()
                    }
                  </p>
                </div>
              </div>
              {podeConvidar && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setModalConvidar(true)}
                  style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", flexShrink: 0 }}
                >
                  <Icon icon={UserPlus} size={13} />
                  Convidar
                </Button>
              )}
            </div>

            {/* Busca (só se tiver convidados) */}
            {participacoesDisplay.length > 0 && (
              <div style={{ position: "relative", marginBottom: "var(--space-4)" }}>
                <Icon icon={Search} size={14} style={{ position: "absolute", left: "var(--space-3)", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)", pointerEvents: "none" }} />
                <input
                  type="text"
                  placeholder="Buscar time..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  style={{ width: "100%", height: "36px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--radius-md)", paddingLeft: "calc(var(--space-3) + 14px + var(--space-2))", paddingRight: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-text-primary)", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(0,230,118,0.35)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                />
              </div>
            )}

            {/* Times agrupados por categoria */}
            {participacoesDisplay.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-8) var(--space-4)" }}>
                <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--space-3)" }}>
                  <Icon icon={Users} size={22} style={{ color: "var(--color-text-muted)" }} />
                </div>
                <p style={{ margin: "0 0 var(--space-1)", fontWeight: 600, color: "white", fontSize: "var(--text-sm)" }}>
                  Nenhum time convidado ainda
                </p>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  {podeConvidar ? "Convide times para participar deste campeonato." : "Os convites aparecerão aqui assim que forem enviados."}
                </p>
              </div>
            ) : participacoesBuscadas.length === 0 ? (
              <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "var(--space-6)", fontSize: "var(--text-sm)", margin: 0 }}>
                Nenhum time encontrado para &quot;{teamSearch}&quot;.
              </p>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="initial"
                animate="animate"
                style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}
              >
                {GRUPOS.map((grupo) => (
                  <div key={grupo.key}>
                    {/* Cabeçalho do grupo */}
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: grupo.color, flexShrink: 0 }} />
                      <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: grupo.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {grupo.label}
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", background: "rgba(255,255,255,0.06)", padding: "1px 8px", borderRadius: "var(--radius-full)", lineHeight: 1.7 }}>
                        {grupo.items.length}
                      </span>
                      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.05)" }} />
                    </div>

                    {/* Lista do grupo */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                      {grupo.items.map((p) => (
                        <motion.div
                          key={p.participacaoId}
                          variants={itemVariants}
                          onClick={() => router.push(`/times/${p.timeId}`)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--space-3)",
                            padding: "var(--space-3)",
                            borderRadius: "var(--radius-lg)",
                            background: "rgba(255,255,255,0.025)",
                            border: `1px solid ${grupo.border}`,
                            transition: "background 0.15s",
                            cursor: "pointer",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = grupo.bg; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; }}
                        >
                          <Avatar name={p.nomeTime} src={p.logoUrl || undefined} size="sm" />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontWeight: 600, color: "white", fontSize: "var(--text-sm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {p.nomeTime}
                            </p>
                            {(p.cidade || p.estado) && (
                              <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                                {[p.cidade, p.estado].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "var(--radius-full)", fontSize: "var(--text-xs)", fontWeight: 600, color: grupo.color, background: grupo.bg, border: `1px solid ${grupo.border}`, flexShrink: 0 }}>
                            <Icon icon={grupo.icon} size={10} />
                            {grupo.label}
                          </span>
                          {podeConvidar && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setTimeParaRemover(p); }}
                              title="Remover do campeonato"
                              style={{ flexShrink: 0, width: "28px", height: "28px", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,72,68,0.2)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,72,68,0.5)", transition: "all 0.15s" }}
                              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,72,68,0.1)"; e.currentTarget.style.color = "var(--color-feedback-danger)"; e.currentTarget.style.borderColor = "rgba(255,72,68,0.4)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,72,68,0.5)"; e.currentTarget.style.borderColor = "rgba(255,72,68,0.2)"; }}
                            >
                              <Icon icon={Trash2} size={12} />
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
            </>
            )}

            {/* ── Aba: Tabela / Chaveamento ────────────────────────────── */}
            {iniciado && aba === "tabela" && (
              <div>
                {temMataMata && !temPontosCorridos ? (
                  carregandoChaveamento ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-6)" }}>
                      <Spinner size="md" ariaLabel="Carregando chaveamento" />
                    </div>
                  ) : chaveamentoData.length === 0 ? (
                    <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "var(--space-6)", fontSize: "var(--text-sm)", margin: 0 }}>
                      O chaveamento aparece após a geração dos jogos.
                    </p>
                  ) : (
                    <Chaveamento chaveamento={chaveamentoData} />
                  )
                ) : carregandoClassificacao ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-6)" }}>
                    <Spinner size="md" ariaLabel="Carregando classificação" />
                  </div>
                ) : classificacaoData.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "var(--space-6)", fontSize: "var(--text-sm)", margin: 0 }}>
                    A classificação aparece após os placares serem lançados.
                  </p>
                ) : (
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                        <th style={{ padding: "var(--space-2)", textAlign: "left", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, width: "28px" }}>#</th>
                        <th style={{ padding: "var(--space-2)", textAlign: "left", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600 }}>Time</th>
                        {[{ k: "pontos", l: "P" }, { k: "jogos", l: "J" }, { k: "vitorias", l: "V" }, { k: "saldoGols", l: "SG" }].map((c) => (
                          <th key={c.k} style={{ padding: "var(--space-2)", textAlign: "center", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 600, width: "36px" }}>{c.l}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {classificacaoData.map((linha) => (
                        <tr key={linha.timeId} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <td style={{ padding: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 700, color: linha.posicao <= 3 ? "var(--color-brand-primary)" : "var(--color-text-muted)" }}>{linha.posicao}</td>
                          <td style={{ padding: "var(--space-2)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                              <Avatar name={linha.nomeTime} src={linha.logoUrl || undefined} size="sm" />
                              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{linha.nomeTime}</span>
                            </div>
                          </td>
                          <td style={{ padding: "var(--space-2)", textAlign: "center", fontSize: "var(--text-sm)", fontWeight: 700, color: "white" }}>{linha.pontos}</td>
                          <td style={{ padding: "var(--space-2)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{linha.jogos}</td>
                          <td style={{ padding: "var(--space-2)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{linha.vitorias}</td>
                          <td style={{ padding: "var(--space-2)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{linha.saldoGols}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <Link
                  href={`/organizador/campeonatos/${id}/${temMataMata && !temPontosCorridos ? "chaveamento" : "classificacao"}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-1)", marginTop: "var(--space-4)", padding: "var(--space-2)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "var(--text-xs)", fontWeight: 600 }}
                >
                  Ver {temMataMata && !temPontosCorridos ? "chaveamento" : "tabela"} completo
                </Link>
              </div>
            )}

            {/* ── Aba: Próximos jogos ──────────────────────────────────── */}
            {iniciado && aba === "jogos" && (
              <div>
                {temPontosCorridos && erroJogos && (
                  <div style={{ display: "flex", gap: "var(--space-2)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", background: "rgba(255,193,7,0.06)", border: "1px solid rgba(255,193,7,0.2)", marginBottom: "var(--space-3)" }}>
                    <Icon icon={AlertTriangle} size={14} style={{ color: "var(--color-feedback-warning)", flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                      Não foi possível carregar os jogos. Verifique se o backend está atualizado.
                    </p>
                  </div>
                )}

                {(carregandoJogos || carregandoChaveamento) ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-6)" }}>
                    <Spinner size="md" ariaLabel="Carregando jogos" />
                  </div>
                ) : proximosJogos.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "var(--space-6)", fontSize: "var(--text-sm)", margin: 0 }}>
                    Nenhum jogo pendente. Todos os jogos foram realizados ou ainda não foram gerados.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                    {proximosJogos.slice(0, 8).map((j) => (
                      <button
                        key={j.id}
                        onClick={() => router.push(`/organizador/campeonatos/${id}/jogo/${j.id}`)}
                        style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", width: "100%", textAlign: "left", transition: "all 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,230,118,0.06)"; e.currentTarget.style.borderColor = "rgba(0,230,118,0.25)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                      >
                        <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--color-text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "var(--radius-full)", flexShrink: 0 }}>
                          {j.etiqueta}
                        </span>
                        <span style={{ flex: 1, textAlign: "right", fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.casa}</span>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontWeight: 700 }}>×</span>
                        <span style={{ flex: 1, textAlign: "left", fontSize: "var(--text-sm)", fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.visitante}</span>
                        <Icon icon={ChevronRight} size={15} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                )}

                <Link
                  href={`/organizador/campeonatos/${id}/jogos`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--space-1)", marginTop: "var(--space-4)", padding: "var(--space-2)", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,255,255,0.08)", color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "var(--text-xs)", fontWeight: 600 }}
                >
                  Ver todos os jogos
                </Link>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ── Em breve ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        style={{ marginTop: "var(--space-8)" }}
      >
        <div style={{ marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--color-text-secondary)" }}>
            Funcionalidades em desenvolvimento
          </p>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "var(--space-2)" }}>
          {FEATURES.map((feat) => (
            <div
              key={feat.title}
              title={feat.desc}
              style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <Icon icon={feat.icon} size={15} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {feat.title}
              </span>
              <span style={{ fontSize: "9px", background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "var(--radius-full)", color: "var(--color-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>
                Em breve
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Modais ───────────────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          [data-camp-grid] { grid-template-columns: minmax(0, 1fr) !important; }
        }

        @media (max-width: 640px) {
          .camp-hero-card { padding: var(--space-4) !important; }
          [data-camp-hero] {
            flex-direction: column;
            align-items: stretch;
            gap: var(--space-4) !important;
          }
          [data-camp-hero-id] {
            flex: 1 1 100% !important;
          }
          [data-camp-hero-stats] {
            width: 100%;
            justify-content: space-around;
            padding: var(--space-3) var(--space-4) !important;
            gap: var(--space-2) !important;
          }
          [data-camp-stat-divider] {
            display: none !important;
          }
        }

        @media (max-width: 400px) {
          [data-camp-logo] {
            width: 3.75rem !important;
            height: 3.75rem !important;
          }
        }
      `}</style>

      <AnimatePresence>
        {modalConvidar && (
          <ConvidarTimeModal campeonato={campeonato} onClose={() => setModalConvidar(false)} convidadosIniciais={todosConvidadosIds} />
        )}
        {modalEditar && (
          <EditarCampeonatoModal campeonato={campeonato} onClose={() => setModalEditar(false)} />
        )}
        {modalCancelar && (
          <CancelarModal
            nome={campeonato.nome}
            onConfirm={handleConfirmarCancelamento}
            onClose={() => setModalCancelar(false)}
            isLoading={isCancelando}
          />
        )}
        {timeParaRemover && (
          <RemoverTimeModal
            nomeTime={timeParaRemover.nomeTime}
            onConfirm={handleConfirmarRemocaoTime}
            onClose={() => setTimeParaRemover(null)}
            isLoading={isRemovendoTime}
          />
        )}
        {logoAmpliada && campeonato.logoUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLogoAmpliada(false)}
            style={{ position: "fixed", inset: 0, zIndex: 2100, display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-6)", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)", cursor: "zoom-out" }}
          >
            <button
              type="button"
              onClick={() => setLogoAmpliada(false)}
              aria-label="Fechar"
              style={{ position: "absolute", top: "var(--space-5)", right: "var(--space-5)", width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.4)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}
            >
              <Icon icon={X} size={18} />
            </button>
            <motion.img
              src={campeonato.logoUrl}
              alt={`Logo de ${campeonato.nome}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "min(90vw, 640px)", maxHeight: "85vh", objectFit: "contain", borderRadius: "var(--radius-lg)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)", cursor: "default" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
