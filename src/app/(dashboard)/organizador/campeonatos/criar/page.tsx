"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { Trophy, Calendar, Star, CheckCircle, Loader2, ImageIcon } from "lucide-react";
import { BotaoVoltar } from "@/components/molecules/BotaoVoltar";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { FormField } from "@/components/molecules/FormField";
import { useToast } from "@/components/atoms/Toast";
import { fadeInUp, getFadeTransition } from "@/lib/motion";
import { useCriarCampeonatoMutation } from "@/store/api/campeonatoApi";
import { useGetPerfilUsuarioQuery } from "@/store/api/userApi";
import { useAppSelector } from "@/store/hooks";
import { Icon } from "@/components/atoms/Icon";
import { FORMATO_CAMPEONATO, type CampeonatoFormValues, type FormatoCampeonato } from "@/types/campeonato";

// Valida potência de 2 (2, 4, 8, 16…) — exigido para a fase de mata-mata
function ehPotenciaDeDois(n: number): boolean {
  return Number.isInteger(n) && n >= 2 && (n & (n - 1)) === 0;
}

const CHAMPIONSHIP_NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9' .-]+$/;

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = parseLocalDate(value);
  return !Number.isNaN(date.getTime());
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

const pontuacaoSchema = z
  .union([z.string(), z.number()])
  .refine((value) => String(value).trim() !== "", "Campo obrigatório")
  .transform((value) => Number(value))
  .refine((value) => Number.isInteger(value), "Use apenas números inteiros")
  .refine((value) => value >= 0, "Mínimo 0")
  .refine((value) => value <= 100, "Máximo 100");

const criarCampeonatoSchema = z
  .object({
    nome: z.string()
      .trim()
      .min(3, "Mínimo 3 caracteres")
      .max(100, "Máximo 100 caracteres")
      .regex(CHAMPIONSHIP_NAME_REGEX, "Use apenas letras, números, espaços, ponto, apóstrofo ou hífen"),
    dataInicio: z.string()
      .min(1, "Campo obrigatório")
      .refine(isValidDateInput, "Data de início inválida")
      .refine((value) => parseLocalDate(value) >= startOfToday(), "Data de início não pode ser anterior a hoje"),
    dataFim: z.string()
      .min(1, "Campo obrigatório")
      .refine(isValidDateInput, "Data de fim inválida"),
    pontosVitoria: pontuacaoSchema,
    pontosDerrota: pontuacaoSchema,
    pontosEmpate:  pontuacaoSchema,
  })
  .refine((d) => parseLocalDate(d.dataFim) > parseLocalDate(d.dataInicio), {
    message: "A data de fim deve ser posterior à de início",
    path: ["dataFim"],
  });

function extrairMensagemErroApi(error: unknown): string {
  const fallback = "Não foi possível criar o campeonato. Tente novamente.";
  if (!error || typeof error !== "object") return fallback;
  const apiError = error as FetchBaseQueryError & {
    data?: { message?: string; mensagem?: string; error?: string };
  };
  return apiError.data?.message ?? apiError.data?.mensagem ?? apiError.data?.error ?? fallback;
}

export default function CriarCampeonatoPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const { user } = useAppSelector((state) => state.auth);
  const [criarCampeonato, { isLoading }] = useCriarCampeonatoMutation();

  const [formato, setFormato] = useState<FormatoCampeonato>("PontosCorridos");
  const [classificam, setClassificam] = useState("4");
  const [classificamError, setClassificamError] = useState<string | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isDragOverLogo, setIsDragOverLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const { data: perfil, isLoading: isLoadingPerfil, isError: isErrorPerfil } = useGetPerfilUsuarioQuery(
    user?.id ?? "",
    { skip: !user?.id }
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<CampeonatoFormValues>({
    resolver: zodResolver(criarCampeonatoSchema) as Resolver<CampeonatoFormValues>,
    defaultValues: {
      nome:          "",
      dataInicio:    "",
      dataFim:       "",
      pontosVitoria: 3,
      pontosDerrota: 0,
      pontosEmpate:  1,
    },
    mode: "onChange",
  });

  const nomeValue = watch("nome");
  const dataInicioValue = watch("dataInicio");
  const dataFimValue = watch("dataFim");

  // Pontuação só se aplica a formatos com fase de pontos corridos
  const usaPontuacao = formato === "PontosCorridos" || formato === "Hibrido";

  const selecionarFormato = (key: FormatoCampeonato): void => {
    setFormato(key);
    // Mata-mata não usa pontuação: zera os campos para não bloquear o submit com erros ocultos
    if (key === "MataMata") {
      setValue("pontosVitoria", 0, { shouldValidate: true });
      setValue("pontosEmpate", 0, { shouldValidate: true });
      setValue("pontosDerrota", 0, { shouldValidate: true });
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

  const onSubmit = async (values: CampeonatoFormValues): Promise<void> => {
    if (!perfil?.organizadorCampeonatoId) {
      toastError("Perfil de organizador não encontrado. Tente novamente.", "Erro");
      return;
    }

    const qtdClassificam = Number(classificam);
    if (formato === "Hibrido" && !ehPotenciaDeDois(qtdClassificam)) {
      setClassificamError("Informe uma potência de 2 (2, 4, 8, 16…).");
      return;
    }
    setClassificamError(null);

    try {
      await criarCampeonato({
        organizadorCampeonatoId: perfil.organizadorCampeonatoId,
        nome:          values.nome,
        dataInicio:    new Date(values.dataInicio).toISOString(),
        dataFim:       new Date(values.dataFim).toISOString(),
        pontosVitoria: usaPontuacao ? values.pontosVitoria : 0,
        pontosDerrota: usaPontuacao ? values.pontosDerrota : 0,
        pontosEmpate:  usaPontuacao ? values.pontosEmpate : 0,
        formatoCampeonato: FORMATO_CAMPEONATO[formato].valor,
        quantidadeTimesClassificam: formato === "Hibrido" ? qtdClassificam : 0,
        logo: logoFile ?? undefined,
      }).unwrap();

      toastSuccess("Campeonato criado com sucesso!");
      router.push("/organizador/campeonatos");
    } catch (error: unknown) {
      toastError(extrairMensagemErroApi(error), "Erro ao criar campeonato");
    }
  };

  const isPerfilReady = !isLoadingPerfil && !!perfil?.organizadorCampeonatoId;
  const canSubmit = isPerfilReady && !isLoading && !logoError;

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
        <BotaoVoltar fallbackHref="/organizador/campeonatos" label="Voltar para campeonatos" />
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
              <Icon icon={Trophy} size={24} style={{ color: "var(--color-brand-primary)" }} />
            </div>
            <h1 style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 700, color: "white", lineHeight: 1.2 }}>
              Criar campeonato
            </h1>
            <p className="text-secondary" style={{ margin: "var(--space-2) 0 0", lineHeight: 1.6 }}>
              Configure as informações e regras do campeonato. Após criar, você poderá convidar times.
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
            ) : isErrorPerfil || !perfil?.organizadorCampeonatoId ? (
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
                    {perfil.organizadorCampeonatoId}
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
              { icon: Trophy,   text: "Campeonato criado como Rascunho" },
              { icon: Calendar, text: "Defina as datas do período oficial"   },
              { icon: Star,     text: "Convide times após a criação"        },
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
              {dataInicioValue && dataFimValue && (
                <p style={{ margin: "4px 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  {new Date(dataInicioValue).toLocaleDateString("pt-BR")} → {new Date(dataFimValue).toLocaleDateString("pt-BR")}
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
                label="Nome do campeonato"
                placeholder="ex: Copa Regional 2026"
                error={errors.nome?.message}
                {...register("nome")}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <FormField
                  label="Data de início"
                  type="date"
                  error={errors.dataInicio?.message}
                  {...register("dataInicio")}
                />
                <FormField
                  label="Data de fim"
                  type="date"
                  error={errors.dataFim?.message}
                  {...register("dataFim")}
                />
              </div>

              {/* Formato do campeonato */}
              <div>
                <p style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                  Formato do campeonato
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {(Object.keys(FORMATO_CAMPEONATO) as FormatoCampeonato[]).map((key) => {
                    const opcao = FORMATO_CAMPEONATO[key];
                    const ativo = formato === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => selecionarFormato(key)}
                        style={{
                          textAlign: "left",
                          padding: "var(--space-3)",
                          borderRadius: "var(--radius-lg)",
                          background: ativo ? "rgba(0,230,118,0.08)" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${ativo ? "rgba(0,230,118,0.4)" : "rgba(255,255,255,0.07)"}`,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <span
                            style={{
                              width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0,
                              border: `2px solid ${ativo ? "var(--color-brand-primary)" : "rgba(255,255,255,0.2)"}`,
                              background: ativo ? "var(--color-brand-primary)" : "transparent",
                            }}
                          />
                          <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "white" }}>
                            {opcao.label}
                          </span>
                        </div>
                        <p style={{ margin: "var(--space-1) 0 0 calc(14px + var(--space-2))", fontSize: "var(--text-xs)", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                          {opcao.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {formato === "Hibrido" && (
                  <div style={{ marginTop: "var(--space-3)" }}>
                    <FormField
                      label="Times que classificam para o mata-mata"
                      type="number"
                      min={2}
                      value={classificam}
                      onChange={(e) => setClassificam(e.target.value)}
                      error={classificamError ?? undefined}
                    />
                    <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      Deve ser uma potência de 2 (2, 4, 8, 16…) para formar o chaveamento.
                    </p>
                  </div>
                )}
              </div>

              {/* Pontuação — apenas para formatos com fase de pontos corridos */}
              {usaPontuacao && (
                <div>
                  <p style={{ margin: "0 0 var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-secondary)" }}>
                    Sistema de pontuação
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "var(--space-3)",
                      padding: "var(--space-3)",
                      borderRadius: "var(--radius-lg)",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    <FormField
                      label="Vitória"
                      type="number"
                      min={0}
                      error={errors.pontosVitoria?.message}
                      {...register("pontosVitoria")}
                    />
                    <FormField
                      label="Empate"
                      type="number"
                      min={0}
                      error={errors.pontosEmpate?.message}
                      {...register("pontosEmpate")}
                    />
                    <FormField
                      label="Derrota"
                      type="number"
                      min={0}
                      error={errors.pontosDerrota?.message}
                      {...register("pontosDerrota")}
                    />
                  </div>
                </div>
              )}

              {/* Upload de logo */}
              <div>
                <label
                  htmlFor="logo"
                  style={{ margin: "0 0 var(--space-2)", display: "inline-flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--color-text-secondary)" }}
                >
                  <Icon icon={ImageIcon} size={14} style={{ color: "var(--color-text-muted)" }} />
                  Logo do campeonato <span style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>(opcional)</span>
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
                  {isLoading ? "Criando campeonato..." : "Criar campeonato"}
                </Button>

                <Link
                  href="/organizador/campeonatos"
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
