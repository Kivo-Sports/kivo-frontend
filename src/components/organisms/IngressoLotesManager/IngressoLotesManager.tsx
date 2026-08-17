"use client";

import { useState } from "react";
import { PackagePlus, Ticket, Users } from "lucide-react";
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
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const limpar = () => {
    setNomeLote("");
    setPreco("");
    setQuantidade("");
  };

  const salvar = async () => {
    const valor = Number(preco.replace(",", "."));
    const total = Number(quantidade);
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
                  {lote.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
            value={nomeLote}
            onChange={(e) => setNomeLote(e.target.value)}
            maxLength={80}
          />
          <Input
            label="Preço por ingresso"
            placeholder="0,00"
            inputMode="decimal"
            value={preco}
            onChange={(e) => setPreco(e.target.value.replace(/[^0-9,.]/g, ""))}
          />
          <Input
            label="Quantidade total"
            placeholder="100"
            type="number"
            min={1}
            step={1}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
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
