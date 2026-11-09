import type { IngressoJaUtilizadoErro, ValidacaoPortariaResponse } from "@/types/ingresso";

export type ResultadoLeitura =
  | { tipo: "liberado"; codigo: string; dados: ValidacaoPortariaResponse }
  | { tipo: "usado"; codigo: string; nomeTitular: string; dataUso: string | null; mensagem: string }
  | { tipo: "negado"; codigo: string; titulo: string; mensagem: string }
  /** Falha de rede/servidor: o ingresso NÃO foi marcado como usado e pode ser lido de novo. */
  | { tipo: "falha"; codigo: string; titulo: string; mensagem: string };

const CODIGO_KIVO = /[0-9A-F]{32}/i;

/**
 * O QR Code do ingresso carrega só o código de validação (32 hex). Se vier dentro de
 * uma URL ou com espaços, extrai o código; senão devolve o texto limpo.
 */
export function extrairCodigo(texto: string): string {
  const limpo = texto.trim();
  return (limpo.match(CODIGO_KIVO)?.[0] ?? limpo).toUpperCase();
}

export function interpretarErroValidacao(error: unknown, codigo: string): ResultadoLeitura {
  const { status, data } = (error ?? {}) as { status?: number | string; data?: unknown };
  const corpo = (typeof data === "object" && data ? data : {}) as Partial<IngressoJaUtilizadoErro>;
  const mensagem = typeof data === "string" && data ? data : corpo.message;

  if (status === 409)
    return {
      tipo: "usado",
      codigo,
      nomeTitular: corpo.nomeTitular ?? "",
      dataUso: corpo.dataUso ?? null,
      mensagem: mensagem ?? "Este ingresso já foi utilizado.",
    };
  // O 403 vem do Forbid() com a mensagem genérica de acesso negado; para o porteiro, explica o motivo
  if (status === 403)
    return {
      tipo: "negado",
      codigo,
      titulo: "Ingresso de outro evento",
      mensagem: "Este ingresso não é de nenhuma partida dos seus campeonatos.",
    };
  if (status === 404)
    return {
      tipo: "negado",
      codigo,
      titulo: "Ingresso não encontrado",
      mensagem: mensagem ?? "Este QR Code não corresponde a nenhum ingresso do Kivo.",
    };
  if (status === 400)
    return {
      tipo: "negado",
      codigo,
      titulo: "Entrada não liberada",
      mensagem: mensagem ?? "Este ingresso não está válido para entrada.",
    };
  return {
    tipo: "falha",
    codigo,
    titulo: "Sem resposta do servidor",
    mensagem:
      "Não foi possível validar agora. O ingresso não foi marcado como usado: verifique a internet e tente de novo.",
  };
}

export function formatarHora(iso: string | null | undefined): string {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Bipe + vibração para o porteiro não precisar olhar a tela a cada leitura. */
export function sinalizarResultado(tipo: ResultadoLeitura["tipo"]) {
  const liberado = tipo === "liberado";
  try {
    navigator.vibrate?.(liberado ? 120 : [220, 90, 220]);
  } catch {
    // vibração indisponível
  }
  try {
    const Contexto =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexto) return;
    const ctx = new Contexto();
    const tons = liberado ? [880, 1320] : [330, 220];
    tons.forEach((frequencia, i) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      const inicio = ctx.currentTime + i * 0.13;
      osc.type = liberado ? "sine" : "square";
      osc.frequency.value = frequencia;
      ganho.gain.setValueAtTime(0.0001, inicio);
      ganho.gain.exponentialRampToValueAtTime(0.18, inicio + 0.01);
      ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.12);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(inicio);
      osc.stop(inicio + 0.13);
    });
    setTimeout(() => ctx.close().catch(() => undefined), 600);
  } catch {
    // áudio bloqueado pelo navegador
  }
}

// ─── Tempo do resultado na tela (preferência do porteiro, salva neste navegador) ───

export const OPCOES_DURACAO_SEGUNDOS = [3, 5, 8, 10] as const;
export const DURACAO_PADRAO_SEGUNDOS = 5;

const CHAVE_DURACAO = "kivo:portaria:duracao-resultado";
const EVENTO_DURACAO = "kivo:portaria:duracao-resultado";
let duracaoAtual: number | null = null;

function lerDuracaoSalva(): number {
  try {
    const salvo = Number(localStorage.getItem(CHAVE_DURACAO));
    return (OPCOES_DURACAO_SEGUNDOS as readonly number[]).includes(salvo)
      ? salvo
      : DURACAO_PADRAO_SEGUNDOS;
  } catch {
    return DURACAO_PADRAO_SEGUNDOS;
  }
}

/** Snapshot para useSyncExternalStore. */
export function obterDuracaoResultado(): number {
  if (duracaoAtual === null) duracaoAtual = lerDuracaoSalva();
  return duracaoAtual;
}

export function salvarDuracaoResultado(segundos: number) {
  duracaoAtual = segundos;
  try {
    localStorage.setItem(CHAVE_DURACAO, String(segundos));
  } catch {
    // modo anônimo/armazenamento bloqueado: vale só enquanto a página estiver aberta
  }
  window.dispatchEvent(new Event(EVENTO_DURACAO));
}

export function assinarDuracaoResultado(avisar: () => void) {
  const aoMudarEmOutraAba = (e: StorageEvent) => {
    if (e.key !== CHAVE_DURACAO) return;
    duracaoAtual = null;
    avisar();
  };
  window.addEventListener(EVENTO_DURACAO, avisar);
  window.addEventListener("storage", aoMudarEmOutraAba);
  return () => {
    window.removeEventListener(EVENTO_DURACAO, avisar);
    window.removeEventListener("storage", aoMudarEmOutraAba);
  };
}
