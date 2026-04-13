"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { Button } from "@/components/atoms/Button";
import { Card } from "@/components/molecules/Card";
import { FormField } from "@/components/molecules/FormField";
import { PageHeader } from "@/components/molecules/PageHeader";
import { useToast } from "@/components/atoms/Toast";
import { fadeIn, fadeInUp, getFadeTransition } from "@/lib/motion";
import { useCriarTimeMutation } from "@/store/api/timeApi";
import type { TimeFormValues } from "@/types/time";

const criarTimeSchema = z.object({
  nome: z.string().min(3, "Mínimo 3 caracteres"),
  cidade: z.string().min(1, "Campo obrigatório"),
  estado: z.string().min(1, "Selecione um estado"),
  logoUrl: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.url().safeParse(value).success, "Informe uma URL válida"),
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

  if (!error || typeof error !== "object") {
    return fallback;
  }

  const apiError = error as FetchBaseQueryError & {
    data?: { message?: string; mensagem?: string; error?: string };
  };

  if (apiError.data?.message) {
    return apiError.data.message;
  }

  if (apiError.data?.mensagem) {
    return apiError.data.mensagem;
  }

  if (apiError.data?.error) {
    return apiError.data.error;
  }

  return fallback;
}

export default function CriarTimePage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [criarTime, { isLoading }] = useCriarTimeMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TimeFormValues>({
    resolver: zodResolver(criarTimeSchema),
    defaultValues: {
      nome: "",
      cidade: "",
      estado: "",
      logoUrl: "",
    },
  });

  const onSubmit = async (values: TimeFormValues): Promise<void> => {
    try {
      await criarTime(values).unwrap();
      toastSuccess("Time criado com sucesso!");
      router.push("/organizador");
    } catch (error: unknown) {
      toastError(extrairMensagemErroApi(error), "Erro ao criar time");
    }
  };

  const selectStyles = [
    "h-12",
    "w-full",
    "rounded-[var(--radius-md)]",
    "border",
    "bg-(--color-bg-input)",
    "px-3",
    "text-sm",
    "text-(--color-text-primary)",
    "outline-none",
    "transition-all",
    "duration-200",
    "focus-visible:ring-2",
    errors.estado?.message
      ? "border-(--color-feedback-danger) focus-visible:border-(--color-feedback-danger) focus-visible:ring-(--color-feedback-danger-bg)"
      : "border-(--color-border-default) focus-visible:border-(--color-border-focus) focus-visible:ring-(--color-feedback-success-bg)",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.main
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={getFadeTransition(0, 0.35)}
      style={{
        width: "100%",
        maxWidth: "900px",
        margin: "0 auto",
        padding: "var(--space-6)",
      }}
    >
      <Card
        padding="lg"
        style={{
          background: "linear-gradient(180deg, rgba(16, 16, 16, 0.85), rgba(5, 5, 5, 0.9))",
          border: "1px solid rgba(0, 255, 128, 0.2)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "0 30px 70px rgba(0, 0, 0, 0.5)",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "var(--space-6)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
            justifyContent: "space-between",
          }}
        >
          <PageHeader
            title="Criar seu time"
            subtitle="Cadastre as informações oficiais para alinhar seu clube ao campeonato."
          />
          <div
            style={{
              background: "rgba(0, 0, 0, 0.35)",
              borderRadius: "var(--radius-xl)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "var(--space-4)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-3)",
            }}
          >
            <p className="text-secondary" style={{ margin: 0, lineHeight: 1.6 }}>
              Nosso processo prioriza clareza e velocidade: nome, cidade e estado garantem que seu
              time esteja apto para participar imediatamente.
            </p>
            <div
              style={{
                display: "grid",
                gap: "var(--space-2)",
                fontSize: "var(--text-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              <div>
                <span style={{ fontSize: "var(--text-xs)", letterSpacing: "0.3em" }}>
                  Checklist
                </span>
                <p style={{ margin: "0.25rem 0 0" }}>Valide os dados oficiais do município.</p>
              </div>
              <div>
                <span style={{ fontSize: "var(--text-xs)", letterSpacing: "0.3em" }}>
                  Identidade
                </span>
                <p style={{ margin: "0.25rem 0 0" }}>
                  Opcional: adicione uma logo para destacar o time.
                </p>
              </div>
              <div>
                <span style={{ fontSize: "var(--text-xs)", letterSpacing: "0.3em" }}>
                  Atualizações
                </span>
                <p style={{ margin: "0.25rem 0 0" }}>Você pode editar essas informações depois.</p>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "grid", gap: "var(--space-4)" }}
          noValidate
        >
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
            <label
              htmlFor="estado"
              className="mb-2 inline-block text-sm font-semibold text-(--color-text-primary)"
            >
              Estado
            </label>
            <select
              id="estado"
              aria-invalid={Boolean(errors.estado?.message)}
              className={selectStyles}
              defaultValue=""
              {...register("estado")}
            >
              <option value="" disabled>
                Estado
              </option>
              {estadosBrasileiros.map((estado) => (
                <option key={estado.sigla} value={estado.sigla}>
                  {estado.sigla} – {estado.nome}
                </option>
              ))}
            </select>
            {errors.estado?.message ? (
              <p
                role="alert"
                style={{
                  marginTop: "var(--space-2)",
                  marginBottom: 0,
                  fontSize: "var(--text-sm)",
                  color: "var(--color-feedback-danger)",
                }}
              >
                {errors.estado.message}
              </p>
            ) : null}
          </div>

          <FormField
            label="URL da logo"
            placeholder="https://"
            error={errors.logoUrl?.message}
            {...register("logoUrl")}
          />
          <p
            style={{
              margin: 0,
              fontSize: "var(--text-xs)",
              color: "var(--color-text-secondary)",
            }}
          >
            Não tem logo ainda? Pode deixar em branco e adicionar depois.
          </p>

          <Button type="submit" loading={isLoading} fullWidth>
            Criar time
          </Button>

          <Link
            href="/organizador"
            className="text-sm font-semibold text-(--color-text-secondary) transition-colors duration-200 hover:text-(--color-text-primary)"
            style={{ textAlign: "center" }}
          >
            Agora não, voltar ao início
          </Link>
        </form>
      </Card>
    </motion.main>
  );
}
