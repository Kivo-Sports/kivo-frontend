"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Minus, PackagePlus, Plus, Ticket, Users } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { Spinner } from "@/components/atoms/Spinner";
import { useToast } from "@/components/atoms/Toast";
import { Card } from "@/components/molecules/Card";
import { Modal } from "@/components/molecules/Modal";
import {
  useCriarLoteIngressoMutation,
  useObterLotesPorPartidaQuery,
} from "@/store/api/ingressoApi";

function mensagemErro(error: unknown): string {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { message?: string } | string }).data;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  return "Não foi possível criar o lote de ingressos.";
}

function formatarCentavos(digitos: string): string {
  if (!digitos) return "";
  return (Number(digitos) / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatarBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const QTD_MIN = 1;
const QTD_MAX = 100000;

function StepperButton({
  onClick,
  disabled,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const ativoHover = hover && !disabled;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        width: 38,
        height: 38,
        padding: 0,
        borderRadius: "var(--radius-md)",
        border: "1px solid transparent",
        background: disabled
          ? "transparent"
          : ativoHover
            ? "color-mix(in srgb, var(--color-brand-primary) 18%, transparent)"
            : "rgba(255,255,255,.07)",
        color: disabled
          ? "var(--color-text-disabled)"
          : ativoHover
            ? "var(--color-brand-primary)"
            : "var(--color-text-primary)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "all var(--transition-fast)",
      }}
    >
      {children}
    </button>
  );
}

function AtalhoChip({
  valor,
  ativo,
  onClick,
}: {
  valor: number;
  ativo: boolean;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "7px 14px",
        borderRadius: "var(--radius-full, 999px)",
        fontSize: "var(--text-xs)",
        fontWeight: 600,
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        cursor: "pointer",
        transition: "all var(--transition-fast)",
        background: ativo
          ? "color-mix(in srgb, var(--color-brand-primary) 18%, transparent)"
          : hover
            ? "rgba(255,255,255,.09)"
            : "rgba(255,255,255,.05)",
        border: ativo
          ? "1px solid color-mix(in srgb, var(--color-brand-primary) 50%, transparent)"
          : "1px solid transparent",
        color: ativo ? "var(--color-brand-primary)" : "var(--color-text-secondary)",
      }}
    >
      {valor.toLocaleString("pt-BR")}
    </button>
  );
}

function QuantidadeField({
  value,
  onChange,
}: {
  value: number;
  onChange: (proximo: number) => void;
}) {
  const [focado, setFocado] = useState(false);

  const ajustar = (delta: number) => {
    onChange(Math.min(QTD_MAX, Math.max(QTD_MIN, (value || 0) + delta)));
  };

  return (
    <div style={{ width: "100%" }}>
      <label
        htmlFor="lote-quantidade"
        style={{
          display: "block",
          marginBottom: "var(--space-2)",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--color-text-primary)",
        }}
      >
        Quantidade de ingressos
      </label>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          height: 52,
          padding: 6,
          background: "var(--color-bg-input)",
          border: `1px solid ${focado ? "var(--color-border-focus)" : "var(--color-border-default)"}`,
          borderRadius: "var(--radius-md)",
          boxShadow: focado ? "0 0 0 2px var(--color-feedback-success-bg)" : "none",
          transition: "all var(--transition-fast)",
        }}
      >
        <StepperButton
          onClick={() => ajustar(-1)}
          disabled={value <= QTD_MIN}
          ariaLabel="Diminuir quantidade"
        >
          <Icon icon={Minus} size={16} />
        </StepperButton>

        <input
          id="lote-quantidade"
          type="text"
          inputMode="numeric"
          name="lote-quantidade"
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore
          data-form-type="other"
          value={value ? String(value) : ""}
          placeholder="100"
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
          onChange={(e) => {
            const digitos = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
            onChange(digitos ? Math.min(QTD_MAX, Number(digitos)) : 0);
          }}
          style={{
            flex: 1,
            minWidth: 0,
            height: "100%",
            padding: "0 var(--space-2)",
            border: 0,
            background: "transparent",
            outline: "none",
            textAlign: "center",
            fontSize: "var(--text-lg)",
            fontWeight: 700,
            fontVariantNumeric: "tabular-nums",
            color: "var(--color-text-primary)",
          }}
        />

        <StepperButton
          onClick={() => ajustar(1)}
          disabled={value >= QTD_MAX}
          ariaLabel="Aumentar quantidade"
        >
          <Icon icon={Plus} size={16} />
        </StepperButton>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-2)",
          marginTop: "var(--space-2)",
        }}
      >
        {[50, 100, 250, 500].map((atalho) => (
          <AtalhoChip
            key={atalho}
            valor={atalho}
            ativo={value === atalho}
            onClick={() => onChange(atalho)}
          />
        ))}
      </div>
    </div>
  );
}

export function IngressoLotesManager({
  partidaId,
  partidaFinalizada,
}: {
  partidaId: string;
  partidaFinalizada: boolean;
}) {
  const { data: lotes = [], isLoading, isError } = useObterLotesPorPartidaQuery(partidaId);
  const [criarLote, { isLoading: salvando }] = useCriarLoteIngressoMutation();
  const { success, error } = useToast();
  const [modalAberto, setModalAberto] = useState(false);
  const [nomeLote, setNomeLote] = useState("");
  const [precoCentavos, setPrecoCentavos] = useState("");
  const [quantidade, setQuantidade] = useState(0);

  const valorUnitario = precoCentavos ? Number(precoCentavos) / 100 : 0;
  const receitaPotencial = valorUnitario * quantidade;

  const limpar = () => {
    setNomeLote("");
    setPrecoCentavos("");
    setQuantidade(0);
  };

  const salvar = async () => {
    const valor = valorUnitario;
    const total = quantidade;
    if (
      !nomeLote.trim() ||
      !Number.isFinite(valor) ||
      valor <= 0 ||
      !Number.isInteger(total) ||
      total < 1
    ) {
      error("Preencha nome, preço e quantidade com valores válidos.", "Dados inválidos");
      return;
    }
    try {
      await criarLote({
        partidaId,
        nomeLote: nomeLote.trim(),
        preco: valor,
        quantidadeTotal: total,
        ativo: true,
      }).unwrap();
      success("Lote criado e disponibilizado para venda.");
      setModalAberto(false);
      limpar();
    } catch (err) {
      error(mensagemErro(err), "Erro ao criar lote");
    }
  };

  return (
    <Card padding="lg" style={{ marginBottom: "var(--space-5)" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Icon icon={Ticket} size={17} style={{ color: "var(--color-brand-primary)" }} />
          <div>
            <h2
              style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700, color: "white" }}
            >
              Lotes de ingressos
            </h2>
            <p
              style={{
                margin: "2px 0 0",
                fontSize: "var(--text-xs)",
                color: "var(--color-text-muted)",
              }}
            >
              Defina preço e quantidade disponível para esta partida.
            </p>
          </div>
        </div>
        <Button size="sm" onClick={() => setModalAberto(true)} disabled={partidaFinalizada}>
          <Icon icon={PackagePlus} size={16} /> Novo lote
        </Button>
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-5)" }}>
          <Spinner size="sm" ariaLabel="Carregando lotes" />
        </div>
      ) : isError ? (
        <p style={{ margin: 0, color: "var(--color-feedback-danger)", fontSize: "var(--text-sm)" }}>
          Não foi possível carregar os lotes.
        </p>
      ) : lotes.length === 0 ? (
        <div
          style={{
            padding: "var(--space-4)",
            border: "1px dashed rgba(255,255,255,.12)",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
            Nenhum lote cadastrado para esta partida.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          {lotes.map((lote) => {
            const vendidos = lote.quantidadeTotal - lote.quantidadeDisponivel;
            const esgotado = lote.quantidadeDisponivel === 0;
            return (
              <div
                key={lote.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--space-3)",
                  padding: "var(--space-3)",
                  background: "rgba(255,255,255,.025)",
                  border: "1px solid rgba(255,255,255,.07)",
                  borderRadius: "var(--radius-lg)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <strong style={{ color: "white", fontSize: "var(--text-sm)" }}>
                      {lote.nomeLote}
                    </strong>
                    <Badge size="sm" variant={esgotado ? "danger" : "success"}>
                      {esgotado ? "Esgotado" : "Ativo"}
                    </Badge>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      marginTop: 6,
                      color: "var(--color-text-muted)",
                      fontSize: "var(--text-xs)",
                    }}
                  >
                    <Icon icon={Users} size={13} /> {vendidos} vendidos ·{" "}
                    {lote.quantidadeDisponivel} disponíveis
                  </span>
                </div>
                <strong style={{ color: "var(--color-brand-primary)", fontSize: "var(--text-lg)" }}>
                  {formatarBRL(lote.preco)}
                </strong>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalAberto}
        onClose={() => !salvando && setModalAberto(false)}
        title="Criar lote de ingressos"
        closeOnOverlayClick={!salvando}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalAberto(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={salvar} loading={salvando}>
              Criar lote
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <Input
            label="Nome do lote"
            placeholder="Ex.: 1º lote"
            name="lote-nome"
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore
            data-form-type="other"
            value={nomeLote}
            onChange={(e) => setNomeLote(e.target.value)}
            maxLength={80}
          />
          <Input
            label="Preço por ingresso"
            placeholder="0,00"
            inputMode="numeric"
            name="lote-preco"
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore
            data-form-type="other"
            icon={<span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>R$</span>}
            value={formatarCentavos(precoCentavos)}
            onChange={(e) => setPrecoCentavos(e.target.value.replace(/[^0-9]/g, "").slice(0, 9))}
          />
          <QuantidadeField value={quantidade} onChange={setQuantidade} />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-3)",
              padding: "var(--space-4)",
              borderRadius: "var(--radius-lg)",
              background: "color-mix(in srgb, var(--color-brand-primary) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--color-brand-primary) 28%, transparent)",
            }}
          >
            <div style={{ display: "grid", gap: 4 }}>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                Receita potencial
              </span>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--color-text-secondary)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {quantidade.toLocaleString("pt-BR")} ingressos × {formatarBRL(valorUnitario)}
              </span>
            </div>
            <strong
              style={{
                color: "var(--color-brand-primary)",
                fontSize: "var(--text-xl)",
                lineHeight: 1.1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatarBRL(receitaPotencial)}
            </strong>
          </div>

          <p
            style={{
              margin: 0,
              color: "var(--color-text-muted)",
              fontSize: "var(--text-xs)",
              lineHeight: 1.5,
            }}
          >
            O lote será publicado imediatamente e o estoque será reduzido a cada compra.
          </p>
        </div>
      </Modal>
    </Card>
  );
}
