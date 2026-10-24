"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Users, MapPin, ImageIcon, CheckCircle, Loader2 } from "lucide-react";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { FormField } from "@/components/molecules/FormField";
import { EsporteSelect } from "@/components/molecules/EsporteSelect";
import { Select } from "@/components/atoms/Select";
import { Icon } from "@/components/atoms/Icon";
import { useToast } from "@/components/atoms/Toast";
import { fadeInUp, getFadeTransition } from "@/lib/motion";
import { useCriarTimeMutation } from "@/store/api/timeApi";
import { useGetPerfilUsuarioQuery } from "@/store/api/userApi";
import { useAppSelector } from "@/store/hooks";
import type { TimeFormValues } from "@/types/time";

const BR_STATE_CODES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];
const TEAM_NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9' .-]+$/;
const CITY_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

const criarTimeSchema = z.object({
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

const estadosBrasileiros: ReadonlyArray<{ sigla: string; nome: string }> = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

function extrairMensagemErroApi(error: unknown): string {
  const fallback = "Não foi possível criar o time. Tente novamente.";
  if (!error || typeof error !== "object") return fallback;
  const apiError = error as FetchBaseQueryError & {
    data?: { message?: string; mensagem?: string; error?: string } | string;
  };
  const data = apiError.data;
  if (typeof data === "string" && data.length > 0) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    const msg = d.message ?? d.mensagem ?? d.error;
    if (typeof msg === "string" && msg.length > 0) return msg;
  }
  return fallback;
}

export default function CriarTimePage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const { user } = useAppSelector((state) => state.auth);
  const [criarTime, { isLoading }] = useCriarTimeMutation();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isDragOverLogo, setIsDragOverLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const { data: perfil, isLoading: isLoadingPerfil, isError: isErrorPerfil } =
    useGetPerfilUsuarioQuery(user?.id ?? "", { skip: !user?.id });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<TimeFormValues>({
    resolver: zodResolver(criarTimeSchema) as Resolver<TimeFormValues>,
    defaultValues: { nome: "", cidade: "", estado: "", esporteId: "" },
    mode: "onChange",
  });

  const nomeValue    = watch("nome");
  const cidadeValue  = watch("cidade");
  const estadoValue  = watch("estado");
  const esporteValue = watch("esporteId");

  const onSubmit = async (values: TimeFormValues): Promise<void> => {
    if (!perfil?.organizadorTimeId) {
      toastError("Perfil de organizador não encontrado. Tente novamente.", "Erro");
      return;
    }
    try {
      await criarTime({ ...values, organizadorTimeId: perfil.organizadorTimeId, logo: logoFile ?? undefined }).unwrap();
      toastSuccess("Time criado com sucesso!");
      router.push("/organizador/times");
    } catch (error: unknown) {
      toastError(extrairMensagemErroApi(error), "Erro ao criar time");
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
    if (!tiposPermitidos.includes(arquivo.type)) return "Formato inválido. Use PNG, JPG/JPEG ou WEBP.";
    if (arquivo.size > MAX_LOGO_SIZE_BYTES) return "Logo deve ter no máximo 5 MB.";
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

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    selecionarLogo(event.target.files?.[0] ?? null);
  };

  const handleLogoDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setIsDragOverLogo(false);
    selecionarLogo(event.dataTransfer.files?.[0] ?? null);
  };

  const isPerfilReady = !isLoadingPerfil && !!perfil?.organizadorTimeId;
  const canSubmit     = isPerfilReady && !isLoading && !logoError;


  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{ width: "100%", maxWidth: "960px", margin: "0 auto", padding: "var(--space-6) var(--space-4)" }}
    >
      {/* Breadcrumb */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ marginBottom: "var(--space-5)" }}
      >
        <BotaoVoltar fallbackHref="/organizador/times" label="Voltar para times" />
      </motion.div>

      <div data-criar-grid style={{ display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)", gap: "var(--space-6)", alignItems: "start" }}>

        {/* Painel esquerdo */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}
        >
          {/* Ícone + título */}
          <div>
            <div
              style={{
                width: "3.25rem", height: "3.25rem",
                borderRadius: "var(--radius-lg)",
                background: "rgba(0, 230, 118, 0.1)",
                border: "1px solid rgba(0, 230, 118, 0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "var(--space-3)",
              }}
            >
              <Icon icon={Users} size={24} style={{ color: "var(--color-brand-primary)" }} />
            </div>
            <h1 style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 700, color: "white", lineHeight: 1.2 }}>
              Criar time
            </h1>
            <p className="text-secondary" style={{ margin: "var(--space-2) 0 0", lineHeight: 1.6 }}>
              Cadastre as informações do seu clube. Após criar, você poderá participar de campeonatos.
            </p>
          </div>

          {/* Status do perfil */}
          <div
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-lg)",
              background: isErrorPerfil
                ? "rgba(255, 72, 72, 0.06)"
                : isLoadingPerfil
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(0, 230, 118, 0.05)",
              border: `1px solid ${isErrorPerfil ? "rgba(255,72,72,0.2)" : isLoadingPerfil ? "rgba(255,255,255,0.06)" : "rgba(0, 230, 118, 0.15)"}`,
              display: "flex",
              alignItems: "flex-start",
              gap: "var(--space-2)",
            }}
          >
            {isLoadingPerfil ? (
              <>
                <Loader2 size={14} style={{ color: "var(--color-text-muted)", marginTop: 2, flexShrink: 0, animation: "spin 1s linear infinite" }} />
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                  Verificando seu perfil de organizador...
                </p>
              </>
            ) : isErrorPerfil || !perfil?.organizadorTimeId ? (
              <>
                <span style={{ fontSize: "var(--text-xs)", flexShrink: 0, marginTop: 1 }}>⚠️</span>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "rgba(255,160,80,0.9)" }}>
                  Perfil de organizador não encontrado. Verifique se sua conta está ativa.
                </p>
              </>
            ) : (
              <>
                <Icon icon={CheckCircle} size={14} style={{ color: "var(--color-brand-primary)", marginTop: 1, flexShrink: 0 }} />
                <div>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-brand-primary)", fontWeight: 600 }}>
                    Perfil verificado
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", fontFamily: "var(--font-dm-mono)", wordBreak: "break-all" }}>
                    {perfil.organizadorTimeId}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Dicas */}
          <Card
            padding="sm"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <p style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-xs)", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-text-muted)" }}>
              Próximos passos
            </p>
            {[
              { icon: Users,     text: "Time criado e pronto para participar" },
              { icon: MapPin,    text: "Confirme a cidade e o estado oficiais" },
              { icon: ImageIcon, text: "Adicione a logo para identificar seu time" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", padding: "var(--space-2) 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <Icon icon={item.icon} size={13} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  {item.text}
                </p>
              </div>
            ))}
          </Card>

          {/* Preview do nome */}
          {nomeValue && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: "var(--space-3)",
                borderRadius: "var(--radius-lg)",
                background: "rgba(0, 230, 118, 0.04)",
                border: "1px solid rgba(0, 230, 118, 0.12)",
              }}
            >
              <p style={{ margin: "0 0 4px", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                Prévia
              </p>
              <p style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "white" }}>
                {nomeValue}
              </p>
              {(cidadeValue || estadoValue) && (
                <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  {[cidadeValue, estadoValue].filter(Boolean).join(" · ")}
                </p>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Formulário */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card
            padding="lg"
            style={{
              background: "linear-gradient(160deg, rgba(18, 18, 18, 0.95), rgba(10, 10, 10, 0.98))",
              border: "1px solid rgba(255, 255, 255, 0.07)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
            }}
          >
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

              <Select
                label="Estado"
                value={estadoValue}
                onChange={(v) => setValue("estado", v, { shouldValidate: true })}
                placeholder="Selecione o estado"
                options={estadosBrasileiros.map((estado) => ({
                  value: estado.sigla,
                  label: `${estado.sigla} – ${estado.nome}`,
                }))}
                error={errors.estado?.message}
              />

              <EsporteSelect
                value={esporteValue}
                onChange={(id) => setValue("esporteId", id, { shouldValidate: true })}
                error={errors.esporteId?.message}
              />

              {/* Upload de logo */}
              <div>
                <label
                  htmlFor="logo"
                  className="mb-2 inline-block text-sm font-semibold text-(--color-text-primary)"
                >
                  Logo do time <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
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
                  onDragOver={(event) => { event.preventDefault(); setIsDragOverLogo(true); }}
                  onDragLeave={(event) => { event.preventDefault(); setIsDragOverLogo(false); }}
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
                    {logoFile ? "Arquivo selecionado" : "Clique ou arraste a logo aqui"}
                  </p>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {logoFile
                      ? `${logoFile.name} (${formatarTamanhoArquivo(logoFile.size)})`
                      : "PNG, JPG/JPEG ou WEBP até 5 MB"}
                  </p>
                </div>
                {logoError && (
                  <p
                    role="alert"
                    style={{ marginTop: "var(--space-2)", marginBottom: 0, fontSize: "var(--text-sm)", color: "var(--color-feedback-danger)" }}
                  >
                    {logoError}
                  </p>
                )}
              </div>

              {/* Ações */}
              <div style={{ display: "grid", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                <Button
                  type="submit"
                  loading={isLoading}
                  disabled={!canSubmit || !isValid}
                  fullWidth
                >
                  {isLoading ? "Criando time..." : "Criar time"}
                </Button>

                <Link
                  href="/organizador/times"
                  style={{
                    textAlign: "center",
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-muted)",
                    textDecoration: "none",
                    padding: "var(--space-2)",
                    transition: "color 0.15s",
                  }}
                >
                  Cancelar e voltar
                </Link>
              </div>
            </form>
          </Card>
        </motion.div>
      </div>
      <style>{`
        @media (max-width: 720px) {
          [data-criar-grid] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </motion.main>
  );
}
