"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { CompraIngressosResponse } from "@/types/ingresso";

const STORAGE_KEY = "kivo_pagamentos_ingressos_pendentes";
const EVENT_NAME = "kivo:pagamentos-ingressos";

export interface PagamentoIngressoPendente {
  asaasPaymentId: string;
  ingressoIds: string[];
  valorTotal: number;
  pixCopiaCola: string;
  qrCodePixBase64: string;
  criadoEm: string;
}

interface PagamentoLegado {
  ingressoId?: string;
  pixCopiaCola?: string;
  qrCodePixBase64?: string;
  criadoEm?: string;
}

function snapshot(): string {
  if (typeof window === "undefined") return "[]";
  return localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function parse(valor: string): PagamentoIngressoPendente[] {
  try {
    const pagamentos = JSON.parse(valor) as Array<PagamentoIngressoPendente | PagamentoLegado>;
    if (!Array.isArray(pagamentos)) return [];
    return pagamentos.flatMap((pagamento) => {
      if ("ingressoIds" in pagamento && Array.isArray(pagamento.ingressoIds)) return [pagamento];
      const legado = pagamento as PagamentoLegado;
      if (!legado.ingressoId) return [];
      return [
        {
          asaasPaymentId: `legado-${legado.ingressoId}`,
          ingressoIds: [legado.ingressoId],
          valorTotal: 0,
          pixCopiaCola: legado.pixCopiaCola ?? "",
          qrCodePixBase64: legado.qrCodePixBase64 ?? "",
          criadoEm: legado.criadoEm ?? new Date(0).toISOString(),
        },
      ];
    });
  } catch {
    return [];
  }
}

function salvar(pagamentos: PagamentoIngressoPendente[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pagamentos));
  window.dispatchEvent(new Event(EVENT_NAME));
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT_NAME, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT_NAME, callback);
    window.removeEventListener("storage", callback);
  };
}

export function guardarPagamentoIngresso(compra: CompraIngressosResponse) {
  const atuais = parse(snapshot());
  const pagamento: PagamentoIngressoPendente = {
    asaasPaymentId: compra.asaasPaymentId,
    ingressoIds: compra.ingressos.map((ingresso) => ingresso.id),
    valorTotal: compra.valorTotal,
    pixCopiaCola: compra.pixCopiaCola,
    qrCodePixBase64: compra.qrCodeBase64,
    criadoEm: compra.ingressos[0]?.dataCompra ?? new Date().toISOString(),
  };
  salvar([pagamento, ...atuais.filter((item) => item.asaasPaymentId !== pagamento.asaasPaymentId)]);
}

export function removerPagamentosIngressos(ids: string[]) {
  if (typeof window === "undefined" || ids.length === 0) return;
  const idsRemovidos = new Set(ids);
  const atuais = parse(snapshot());
  const restantes = atuais
    .map((pagamento) => ({
      ...pagamento,
      ingressoIds: pagamento.ingressoIds.filter((id) => !idsRemovidos.has(id)),
    }))
    .filter((pagamento) => pagamento.ingressoIds.length > 0);
  const quantidadeAtual = atuais.reduce((total, item) => total + item.ingressoIds.length, 0);
  const quantidadeRestante = restantes.reduce((total, item) => total + item.ingressoIds.length, 0);
  if (quantidadeRestante !== quantidadeAtual) salvar(restantes);
}

export function usePagamentosIngressosPendentes() {
  const valor = useSyncExternalStore(subscribe, snapshot, () => "[]");
  return useMemo(() => parse(valor), [valor]);
}
