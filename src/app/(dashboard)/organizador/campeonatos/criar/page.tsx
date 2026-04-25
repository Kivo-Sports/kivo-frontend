"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { Trophy, Calendar, Star, CheckCircle, ArrowLeft, Loader2 } from "lucide-react";
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
import type { CampeonatoFormValues } from "@/types/campeonato";

const criarCampeonatoSchema = z
  .object({
    nome:          z.string().min(3, "Mínimo 3 caracteres"),
    dataInicio:    z.string().min(1, "Campo obrigatório"),
    dataFim:       z.string().min(1, "Campo obrigatório"),
    pontosVitoria: z.coerce.number().int().min(0, "Mínimo 0"),
    pontosDerrota: z.coerce.number().int().min(0, "Mínimo 0"),
    pontosEmpate:  z.coerce.number().int().min(0, "Mínimo 0"),
  })
  .refine((d) => new Date(d.dataFim) > new Date(d.dataInicio), {
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

  const { data: perfil, isLoading: isLoadingPerfil, isError: isErrorPerfil } = useGetPerfilUsuarioQuery(
    user?.id ?? "",
    { skip: !user?.id }
  );

  const {
    register,
    handleSubmit,
    watch,
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

  const onSubmit = async (values: CampeonatoFormValues): Promise<void> => {
    if (!perfil?.organizadorCampeonatoId) {
      toastError("Perfil de organizador não encontrado. Tente novamente.", "Erro");
      return;
    }

    try {
      await criarCampeonato({
        organizadorCampeonatoId: perfil.organizadorCampeonatoId,
        nome:          values.nome,
        dataInicio:    new Date(values.dataInicio).toISOString(),
        dataFim:       new Date(values.dataFim).toISOString(),
        pontosVitoria: values.pontosVitoria,
        pontosDerrota: values.pontosDerrota,
        pontosEmpate:  values.pontosEmpate,
      }).unwrap();

      toastSuccess("Campeonato criado com sucesso!");
      router.push("/organizador/campeonatos");
    } catch (error: unknown) {
      toastError(extrairMensagemErroApi(error), "Erro ao criar campeonato");
    }
  };

  const isPerfilReady = !isLoadingPerfil && !!perfil?.organizadorCampeonatoId;
  const canSubmit = isPerfilReady && !isLoading;

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
        <Link
          href="/organizador/campeonatos"
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
          Voltar para campeonatos
        </Link>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)", gap: "var(--space-6)", alignItems: "start" }}>

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

              {/* Pontuação */}
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
    </motion.main>
  );
}
