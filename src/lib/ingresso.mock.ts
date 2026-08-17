"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "qrcode";
import type { DetalhePartidaResponse } from "@/types/partida";
import type { IngressoDetalhes, IngressoLote } from "@/types/ingresso";
import { StatusIngresso } from "@/types/ingresso";

const STORAGE_KEY = "kivo_ingressos_simulados";
const EVENT_NAME = "kivo:ingressos-simulados";

function idAleatorio(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function carregar(): IngressoDetalhes[] {
  if (typeof window === "undefined") return [];
  try {
    const valor = localStorage.getItem(STORAGE_KEY);
    return valor ? (JSON.parse(valor) as IngressoDetalhes[]) : [];
  } catch {
    return [];
  }
}

function salvar(ingressos: IngressoDetalhes[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ingressos));
  window.dispatchEvent(new Event(EVENT_NAME));
}

function gerarQrCodeReal(codigo: string): Promise<string> {
  return QRCode.toDataURL(codigo, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
    color: { dark: "#101010", light: "#ffffff" },
  });
}

export function criarCompraSimulada(
  lote: IngressoLote,
  quantidade: number,
  partida: DetalhePartidaResponse,
  usuarioId: string,
): IngressoDetalhes[] {
  const agora = new Date().toISOString();
  const novos = Array.from({ length: quantidade }, () => {
    const id = idAleatorio();
    return {
      id,
      usuarioId,
      nomeLote: lote.nomeLote,
      nomePartida: `${partida.nomeTimeCasa} x ${partida.nomeTimeVisitante}`,
      dataPartida: partida.dataHora ?? agora,
      localPartida: partida.local || "Local a definir",
      precoPago: lote.preco,
      dataCompra: agora,
      status: StatusIngresso.Pendente,
      codigoValidacao: `KIVO-${id.replace(/-/g, "").slice(0, 18).toUpperCase()}`,
      qrCodeBase64: "",
      pixCopiaCola: `00020126580014BR.GOV.BCB.PIX0136${id}520400005303986540${lote.preco.toFixed(2)}5802BR5911KIVO SPORTS6009CURITIBA62070503***6304DEMO`,
    } satisfies IngressoDetalhes;
  });
  salvar([...novos, ...carregar()]);
  return novos;
}

export async function confirmarPagamentoSimulado(ids: string[]): Promise<IngressoDetalhes[]> {
  const ingressosSelecionados = new Set(ids);
  const atualizados = await Promise.all(
    carregar().map(async (ingresso) =>
      ingressosSelecionados.has(ingresso.id)
        ? {
            ...ingresso,
            status: StatusIngresso.Pago,
            qrCodeBase64: await gerarQrCodeReal(ingresso.codigoValidacao),
          }
        : ingresso,
    ),
  );
  salvar(atualizados);
  return atualizados.filter((ingresso) => ingressosSelecionados.has(ingresso.id));
}

async function atualizarQrCodesAntigos(): Promise<void> {
  const ingressos = carregar();
  let encontrouQrCodeAntigo = false;
  const atualizados = await Promise.all(
    ingressos.map(async (ingresso) => {
      const liberado =
        ingresso.status === StatusIngresso.Pago || ingresso.status === StatusIngresso.Utilizado;
      const qrCodeReal = ingresso.qrCodeBase64.startsWith("data:image/png;base64,");
      if (!liberado || qrCodeReal) return ingresso;
      encontrouQrCodeAntigo = true;
      return {
        ...ingresso,
        qrCodeBase64: await gerarQrCodeReal(ingresso.codigoValidacao),
      };
    }),
  );
  if (encontrouQrCodeAntigo) salvar(atualizados);
}

export function validarIngressoSimulado(codigo: string): { sucesso: boolean; mensagem: string } {
  const ingressos = carregar();
  const ingresso = ingressos.find((item) => item.codigoValidacao === codigo.trim().toUpperCase());
  if (!ingresso) return { sucesso: false, mensagem: "Ingresso demonstrativo não encontrado." };
  if (ingresso.status === StatusIngresso.Utilizado)
    return { sucesso: false, mensagem: "Este ingresso demonstrativo já foi utilizado." };
  if (ingresso.status !== StatusIngresso.Pago)
    return { sucesso: false, mensagem: "O pagamento demonstrativo ainda não foi confirmado." };
  salvar(
    ingressos.map((item) =>
      item.id === ingresso.id ? { ...item, status: StatusIngresso.Utilizado } : item,
    ),
  );
  return { sucesso: true, mensagem: "Ingresso demonstrativo validado. Entrada simulada liberada." };
}

export function useIngressosSimulados(usuarioId?: string) {
  const [ingressos, setIngressos] = useState<IngressoDetalhes[]>([]);
  const atualizar = useCallback(
    () =>
      setIngressos(carregar().filter((ingresso) => !usuarioId || ingresso.usuarioId === usuarioId)),
    [usuarioId],
  );
  useEffect(() => {
    const carregamentoInicial = window.setTimeout(() => {
      atualizar();
      void atualizarQrCodesAntigos();
    }, 0);
    window.addEventListener(EVENT_NAME, atualizar);
    window.addEventListener("storage", atualizar);
    return () => {
      window.clearTimeout(carregamentoInicial);
      window.removeEventListener(EVENT_NAME, atualizar);
      window.removeEventListener("storage", atualizar);
    };
  }, [atualizar]);
  return { ingressos, atualizar };
}
