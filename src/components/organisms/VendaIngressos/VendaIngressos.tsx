"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Minus, Plus, ShoppingCart, Ticket, Trash2 } from "lucide-react";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/atoms/Icon";
import { Spinner } from "@/components/atoms/Spinner";
import { useToast } from "@/components/atoms/Toast";
import { Card } from "@/components/molecules/Card";
import { Modal } from "@/components/molecules/Modal";
import {
  guardarPagamentoIngresso,
  removerPagamentosIngressos,
} from "@/lib/pagamento-ingresso.storage";
import { useAppSelector } from "@/store/hooks";
import {
  useComprarIngressosMutation,
  useConfirmarPagamentoIngressoMutation,
  useLazyObterMeusIngressosQuery,
  useObterLotesPorPartidaQuery,
} from "@/store/api/ingressoApi";
import type { CompraIngressosResponse, IngressoLote } from "@/types/ingresso";
import { StatusIngresso } from "@/types/ingresso";

const LIMITE_POR_COMPRA = 10;

function mensagemErro(error: unknown, fallback = "Não foi possível concluir a operação."): string {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { message?: string } | string }).data;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  return fallback;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function VendaIngressos({
  partidaId,
  indisponivel,
}: {
  partidaId: string;
  indisponivel?: boolean;
}) {
  const router = useRouter();
  const auth = useAppSelector((state) => state.auth);
  const toast = useToast();
  const { data: lotes = [], isLoading, isError } = useObterLotesPorPartidaQuery(partidaId);
  const [comprarIngressos, { isLoading: comprando }] = useComprarIngressosMutation();
  const [confirmarPagamento, { isLoading: verificandoPagamento }] =
    useConfirmarPagamentoIngressoMutation();
  const [consultarIngressos, { isFetching: consultandoIngressos }] =
    useLazyObterMeusIngressosQuery();
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [revisando, setRevisando] = useState(false);
  const [compraPix, setCompraPix] = useState<CompraIngressosResponse | null>(null);
  const [copiado, setCopiado] = useState(false);

  const itensCarrinho = lotes
    .map((lote) => ({ lote, quantidade: quantidades[lote.id] ?? 0 }))
    .filter((item) => item.quantidade > 0);
  const quantidadeTotal = itensCarrinho.reduce((total, item) => total + item.quantidade, 0);
  const valorTotal = itensCarrinho.reduce(
    (total, item) => total + item.lote.preco * item.quantidade,
    0,
  );
  const verificando = verificandoPagamento || consultandoIngressos;

  const exigirLogin = () => {
    if (auth.isAuthenticated) return true;
    toast.info("Entre na sua conta para comprar ingressos.", "Login necessário");
    router.push(`/login?redirect=/jogos/${partidaId}`);
    return false;
  };

  const definirQuantidade = (lote: IngressoLote, quantidadeDesejada: number) => {
    if (!exigirLogin()) return;
    const quantidadeAtual = quantidades[lote.id] ?? 0;
    const disponivelNoLimite = LIMITE_POR_COMPRA - (quantidadeTotal - quantidadeAtual);
    const proximaQuantidade = Math.max(
      0,
      Math.min(quantidadeDesejada, lote.quantidadeDisponivel, disponivelNoLimite),
    );

    if (quantidadeDesejada > proximaQuantidade && quantidadeTotal >= LIMITE_POR_COMPRA) {
      toast.warning(`Cada compra pode ter no máximo ${LIMITE_POR_COMPRA} ingressos.`);
    }

    setQuantidades((atuais) => {
      if (proximaQuantidade === 0) {
        const restantes = { ...atuais };
        delete restantes[lote.id];
        return restantes;
      }
      return { ...atuais, [lote.id]: proximaQuantidade };
    });
  };

  const concluir = async () => {
    if (itensCarrinho.length === 0) return;
    try {
      const resultado = await comprarIngressos({
        itens: itensCarrinho.map(({ lote, quantidade }) => ({
          ingressoLoteId: lote.id,
          quantidade,
        })),
      }).unwrap();
      guardarPagamentoIngresso(resultado);
      setCompraPix(resultado);
      setRevisando(false);
      setQuantidades({});
      toast.success("Cobrança PIX única gerada para todos os ingressos.");
    } catch (error) {
      toast.error(
        mensagemErro(error, "Não foi possível gerar a cobrança PIX. Tente novamente."),
        "Erro ao comprar ingressos",
      );
    }
  };

  const verificarPagamento = async () => {
    const primeiroIngresso = compraPix?.ingressos[0];
    if (!compraPix || !primeiroIngresso) return;

    let erroConfirmacao: unknown;
    try {
      await confirmarPagamento(primeiroIngresso.id).unwrap();
    } catch (error) {
      erroConfirmacao = error;
    }

    try {
      const ingressos = await consultarIngressos().unwrap();
      const idsCompra = new Set(compraPix.ingressos.map((ingresso) => ingresso.id));
      const confirmados = ingressos.filter(
        (ingresso) =>
          idsCompra.has(ingresso.id) &&
          (ingresso.status === StatusIngresso.Pago || ingresso.status === StatusIngresso.Utilizado),
      );

      if (confirmados.length === compraPix.ingressos.length) {
        removerPagamentosIngressos([...idsCompra]);
        setCompraPix(null);
        toast.success(
          "Pagamento confirmado. Agora defina o titular de cada ingresso.",
          "Ingressos pagos",
        );
        router.push("/meus-ingressos");
        return;
      }

      toast.info(
        erroConfirmacao
          ? mensagemErro(
              erroConfirmacao,
              "O pagamento ainda não foi confirmado. Aguarde alguns segundos.",
            )
          : "O pagamento ainda não foi confirmado. Aguarde alguns segundos e tente novamente.",
        "Aguardando confirmação",
      );
    } catch (error) {
      toast.error(
        mensagemErro(error, "Não foi possível consultar seus ingressos."),
        "Erro ao verificar pagamento",
      );
    }
  };

  const copiarPix = async () => {
    if (!compraPix?.pixCopiaCola) return;
    try {
      await navigator.clipboard.writeText(compraPix.pixCopiaCola);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "white" }}>
              Monte sua compra
            </p>
            <Badge size="sm" variant="success">
              PIX único
            </Badge>
          </div>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-muted)",
            }}
          >
            Escolha até {LIMITE_POR_COMPRA} ingressos entre os lotes desta partida.
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
            const quantidade = quantidades[lote.id] ?? 0;
            const podeAdicionar =
              !esgotado &&
              quantidade < lote.quantidadeDisponivel &&
              quantidadeTotal < LIMITE_POR_COMPRA;
            return (
              <div
                key={lote.id}
                style={{
                  padding: "var(--space-3)",
                  border:
                    quantidade > 0
                      ? "1px solid rgba(0,230,118,.28)"
                      : "1px solid rgba(255,255,255,.08)",
                  background: quantidade > 0 ? "rgba(0,230,118,.045)" : "transparent",
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
                    {lote.quantidadeDisponivel} disponíveis · {formatarMoeda(lote.preco)} cada
                  </span>
                </div>

                {quantidade === 0 ? (
                  <Button
                    size="sm"
                    onClick={() => definirQuantidade(lote, 1)}
                    disabled={esgotado || indisponivel}
                  >
                    <Icon icon={Plus} size={15} /> Adicionar
                  </Button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      aria-label={`Remover uma unidade de ${lote.nomeLote}`}
                      onClick={() => definirQuantidade(lote, quantidade - 1)}
                      style={{
                        width: 34,
                        height: 34,
                        display: "grid",
                        placeItems: "center",
                        background: "transparent",
                        border: "1px solid var(--color-border-default)",
                        color: "white",
                        borderRadius: 8,
                        cursor: "pointer",
                      }}
                    >
                      <Icon icon={quantidade === 1 ? Trash2 : Minus} size={14} />
                    </button>
                    <div style={{ minWidth: 66, textAlign: "center" }}>
                      <strong style={{ display: "block", color: "white" }}>{quantidade}</strong>
                      <span style={{ color: "var(--color-text-muted)", fontSize: 10 }}>
                        {formatarMoeda(lote.preco * quantidade)}
                      </span>
                    </div>
                    <button
                      aria-label={`Adicionar uma unidade de ${lote.nomeLote}`}
                      onClick={() => definirQuantidade(lote, quantidade + 1)}
                      disabled={!podeAdicionar}
                      style={{
                        width: 34,
                        height: 34,
                        display: "grid",
                        placeItems: "center",
                        background: "rgba(0,230,118,.08)",
                        border: "1px solid rgba(0,230,118,.25)",
                        color: "var(--color-brand-primary)",
                        borderRadius: 8,
                        cursor: podeAdicionar ? "pointer" : "not-allowed",
                        opacity: podeAdicionar ? 1 : 0.45,
                      }}
                    >
                      <Icon icon={Plus} size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {quantidadeTotal > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-4)",
                padding: "var(--space-4)",
                borderRadius: "var(--radius-lg)",
                background: "rgba(0,230,118,.07)",
                border: "1px solid rgba(0,230,118,.2)",
                flexWrap: "wrap",
              }}
            >
              <div>
                <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                  {quantidadeTotal} ingresso{quantidadeTotal === 1 ? "" : "s"} em{" "}
                  {itensCarrinho.length} lote{itensCarrinho.length === 1 ? "" : "s"}
                </span>
                <strong
                  style={{ display: "block", color: "var(--color-brand-primary)", fontSize: 20 }}
                >
                  {formatarMoeda(valorTotal)}
                </strong>
              </div>
              <Button onClick={() => setRevisando(true)} disabled={indisponivel}>
                <Icon icon={ShoppingCart} size={16} /> Continuar para pagamento
              </Button>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={revisando}
        onClose={() => !comprando && setRevisando(false)}
        title="Revisar compra"
        closeOnOverlayClick={!comprando}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRevisando(false)} disabled={comprando}>
              Voltar
            </Button>
            <Button onClick={concluir} loading={comprando}>
              Gerar PIX
            </Button>
          </>
        }
      >
        <div style={{ display: "grid", gap: "var(--space-3)" }}>
          {itensCarrinho.map(({ lote, quantidade }) => (
            <div
              key={lote.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                paddingBottom: "var(--space-3)",
                borderBottom: "1px solid rgba(255,255,255,.08)",
              }}
            >
              <div>
                <strong style={{ display: "block", color: "white", fontSize: "var(--text-sm)" }}>
                  {lote.nomeLote}
                </strong>
                <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
                  {quantidade} × {formatarMoeda(lote.preco)}
                </span>
              </div>
              <strong style={{ color: "white" }}>{formatarMoeda(lote.preco * quantidade)}</strong>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <strong style={{ color: "white" }}>Total</strong>
            <strong style={{ color: "var(--color-brand-primary)", fontSize: 20 }}>
              {formatarMoeda(valorTotal)}
            </strong>
          </div>
          <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "var(--text-xs)" }}>
            Será criada uma única cobrança PIX para todos os ingressos.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(compraPix)}
        onClose={() => !verificando && setCompraPix(null)}
        title="Pagamento via PIX"
        maxWidth={620}
        closeOnOverlayClick={!verificando}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCompraPix(null)} disabled={verificando}>
              Fechar
            </Button>
            <Button onClick={verificarPagamento} loading={verificando}>
              Verificar pagamento
            </Button>
          </>
        }
      >
        {compraPix && (
          <div>
            <p
              style={{
                margin: "0 0 var(--space-4)",
                color: "var(--color-text-secondary)",
                fontSize: "var(--text-sm)",
                lineHeight: 1.55,
              }}
            >
              Este PIX corresponde aos {compraPix.ingressos.length} ingressos da compra. Após o
              pagamento, defina o titular de cada ingresso para liberar os QR Codes de entrada.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <span style={{ color: "var(--color-text-muted)", fontSize: "var(--text-sm)" }}>
                Valor total
              </span>
              <strong style={{ color: "var(--color-brand-primary)" }}>
                {formatarMoeda(compraPix.valorTotal)}
              </strong>
            </div>
            {compraPix.qrCodeBase64 && (
              <div
                style={{
                  width: 240,
                  maxWidth: "100%",
                  margin: "0 auto 12px",
                  padding: 10,
                  background: "white",
                  borderRadius: 12,
                }}
              >
                <Image
                  src={compraPix.qrCodeBase64}
                  alt="QR Code PIX da compra"
                  width={220}
                  height={220}
                  unoptimized
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              onClick={copiarPix}
              disabled={!compraPix.pixCopiaCola}
            >
              <Icon icon={copiado ? Check : Copy} size={15} />
              {copiado ? "PIX copiado" : "Copiar PIX copia e cola"}
            </Button>
          </div>
        )}
      </Modal>
    </Card>
  );
}
