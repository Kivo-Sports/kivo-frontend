"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Minus, Plus, ShoppingCart, Ticket } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { useToast } from "@/components/atoms/Toast";
import { Card } from "@/components/molecules/Card";
import { Modal } from "@/components/molecules/Modal";
import { useAppSelector } from "@/store/hooks";
import { useObterLotesPorPartidaQuery } from "@/store/api/ingressoApi";
import type { IngressoDetalhes, IngressoLote } from "@/types/ingresso";
import type { DetalhePartidaResponse } from "@/types/partida";
import { confirmarPagamentoSimulado, criarCompraSimulada } from "@/lib/ingresso.mock";

export function VendaIngressos({
  partidaId,
  partida,
  indisponivel,
}: {
  partidaId: string;
  partida: DetalhePartidaResponse;
  indisponivel?: boolean;
}) {
  const router = useRouter();
  const auth = useAppSelector((state) => state.auth);
  const toast = useToast();
  const { data: lotes = [], isLoading, isError } = useObterLotesPorPartidaQuery(partidaId);
  const [comprando, setComprando] = useState(false);
  const [selecionado, setSelecionado] = useState<IngressoLote | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [cobrancas, setCobrancas] = useState<IngressoDetalhes[]>([]);
  const [copiado, setCopiado] = useState<string | null>(null);

  const iniciarCompra = (lote: IngressoLote) => {
    if (!auth.isAuthenticated) {
      toast.info("Entre na sua conta para comprar ingressos.", "Login necessário");
      router.push(`/login?redirect=/jogos/${partidaId}`);
      return;
    }
    setSelecionado(lote);
    setQuantidade(1);
  };

  const concluir = async () => {
    if (!selecionado || !auth.user) return;
    setComprando(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const resultado = criarCompraSimulada(selecionado, quantidade, partida, auth.user.id);
    setCobrancas(resultado);
    setSelecionado(null);
    setComprando(false);
    toast.info(
      "Cobrança PIX demonstrativa gerada. Nenhum pagamento real será realizado.",
      "Simulação",
    );
  };

  const simularPagamento = async () => {
    setComprando(true);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    await confirmarPagamentoSimulado(cobrancas.map((item) => item.id));
    setComprando(false);
    setCobrancas([]);
    toast.success("Pagamento aprovado no ambiente demonstrativo.", "Simulação concluída");
    router.push("/meus-ingressos");
  };

  const copiar = async (codigo: string, id: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(id);
      setTimeout(() => setCopiado(null), 1800);
    } catch {
      toast.error("Não foi possível copiar o código PIX.");
    }
  };

  return (
    <Card
      padding="md"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "var(--radius-xl)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-3)",
          marginBottom: lotes.length ? "var(--space-4)" : 0,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--radius-lg)",
            background: "rgba(0,230,118,.08)",
            border: "1px solid rgba(0,230,118,.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon icon={Ticket} size={20} style={{ color: "var(--color-brand-primary)" }} />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "white" }}>
              Ingressos
            </p>
            <Badge size="sm" variant="info">
              Demonstração
            </Badge>
          </div>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            Simule a escolha do lote e o pagamento via PIX.
          </p>
        </div>
      </div>
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
          <Spinner size="sm" ariaLabel="Carregando ingressos" />
        </div>
      ) : isError ? (
        <p style={{ margin: 0, color: "var(--color-feedback-danger)", fontSize: "var(--text-sm)" }}>
          Ingressos indisponíveis no momento.
        </p>
      ) : lotes.length === 0 ? (
        <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
          Ainda não há lotes disponíveis para esta partida.
        </p>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          {lotes.map((lote) => {
            const esgotado = lote.quantidadeDisponivel < 1;
            return (
              <div
                key={lote.id}
                style={{
                  padding: "var(--space-3)",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: "var(--radius-lg)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <strong style={{ color: "white", fontSize: "var(--text-sm)" }}>
                      {lote.nomeLote}
                    </strong>
                    {esgotado && (
                      <Badge size="sm" variant="danger">
                        Esgotado
                      </Badge>
                    )}
                  </div>
                  <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                    {lote.quantidadeDisponivel} disponíveis
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <strong style={{ color: "var(--color-brand-primary)" }}>
                    {lote.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </strong>
                  <Button
                    size="sm"
                    onClick={() => iniciarCompra(lote)}
                    disabled={esgotado || indisponivel}
                  >
                    <Icon icon={ShoppingCart} size={15} /> Comprar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={Boolean(selecionado)}
        onClose={() => !comprando && setSelecionado(null)}
        title="Confirmar compra"
        closeOnOverlayClick={!comprando}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelecionado(null)} disabled={comprando}>
              Cancelar
            </Button>
            <Button onClick={concluir} loading={comprando}>
              Gerar PIX
            </Button>
          </>
        }
      >
        {selecionado && (
          <div>
            <p style={{ color: "white", fontWeight: 700, margin: "0 0 var(--space-1)" }}>
              {selecionado.nomeLote}
            </p>
            <p
              style={{
                color: "var(--color-text-muted)",
                fontSize: "var(--text-sm)",
                margin: "0 0 var(--space-4)",
              }}
            >
              {selecionado.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}{" "}
              por ingresso
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-3)",
                background: "rgba(255,255,255,.03)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                Quantidade
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  aria-label="Diminuir"
                  onClick={() => setQuantidade((v) => Math.max(1, v - 1))}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--color-border-default)",
                    color: "white",
                    borderRadius: 6,
                    padding: 6,
                    cursor: "pointer",
                  }}
                >
                  <Icon icon={Minus} size={14} />
                </button>
                <strong style={{ color: "white" }}>{quantidade}</strong>
                <button
                  aria-label="Aumentar"
                  onClick={() =>
                    setQuantidade((v) => Math.min(10, selecionado.quantidadeDisponivel, v + 1))
                  }
                  style={{
                    background: "transparent",
                    border: "1px solid var(--color-border-default)",
                    color: "white",
                    borderRadius: 6,
                    padding: 6,
                    cursor: "pointer",
                  }}
                >
                  <Icon icon={Plus} size={14} />
                </button>
              </div>
            </div>
            <p style={{ color: "white", textAlign: "right", fontWeight: 700 }}>
              Total:{" "}
              {(selecionado.preco * quantidade).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            </p>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={cobrancas.length > 0}
        onClose={() => setCobrancas([])}
        title="PIX demonstrativo"
        maxWidth={560}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCobrancas([])} disabled={comprando}>
              Cancelar
            </Button>
            <Button onClick={simularPagamento} loading={comprando}>
              Simular pagamento aprovado
            </Button>
          </>
        }
      >
        <p
          style={{
            margin: "0 0 var(--space-4)",
            color: "var(--color-text-secondary)",
            fontSize: "var(--text-sm)",
          }}
        >
          Este fluxo representa como seria a integração com uma API de pagamentos. Os códigos não
          realizam cobranças reais e servem somente para demonstração.
        </p>
        <div
          style={{ display: "grid", gap: "var(--space-3)", maxHeight: "52vh", overflowY: "auto" }}
        >
          {cobrancas.map((item, index) => (
            <div
              key={item.id}
              style={{
                padding: "var(--space-3)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <strong style={{ color: "white", fontSize: "var(--text-sm)" }}>
                Ingresso {index + 1}
              </strong>
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => copiar(item.pixCopiaCola, item.id)}
                disabled={!item.pixCopiaCola}
              >
                <Icon icon={copiado === item.id ? Check : Copy} size={15} />{" "}
                {copiado === item.id ? "Copiado" : "Copiar PIX"}
              </Button>
            </div>
          ))}
        </div>
      </Modal>
    </Card>
  );
}
