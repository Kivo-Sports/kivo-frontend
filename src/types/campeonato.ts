export type FormatoCampeonato = "PontosCorridos" | "MataMata" | "Hibrido";

// Valor numérico esperado pelo enum EnumFormatoCampeonato no backend
export const FORMATO_CAMPEONATO: Record<
  FormatoCampeonato,
  { valor: number; label: string; desc: string }
> = {
  PontosCorridos: {
    valor: 0,
    label: "Pontos Corridos",
    desc: "Todos jogam contra todos; vence quem somar mais pontos.",
  },
  MataMata: {
    valor: 1,
    label: "Mata-Mata",
    desc: "Confrontos eliminatórios diretos. Exige potência de 2 (4, 8, 16…).",
  },
  Hibrido: {
    valor: 2,
    label: "Híbrido",
    desc: "Fase de pontos corridos seguida de mata-mata entre os classificados.",
  },
};

export interface CriarCampeonatoRequest {
  organizadorCampeonatoId: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  pontosVitoria: number;
  pontosDerrota: number;
  pontosEmpate: number;
  formatoCampeonato: number;
  quantidadeTimesClassificam: number;
  logo?: File;
}

export interface EditarCampeonatoRequest {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  pontosVitoria: number;
  pontosDerrota: number;
  pontosEmpate: number;
  formatoCampeonato: number;
  quantidadeTimesClassificam: number;
  logo?: File;
}

export interface CampeonatoResponse {
  id: string;
  organizadorCampeonatoId: string;
  organizadorNome?: string | null;
  nome: string;
  dataInicio: string;
  dataFim: string;
  logoUrl: string | null;
  status: string;
  totalTimes: number;
  criadoEm: string;
  pontosVitoria: number;
  pontosDerrota: number;
  pontosEmpate: number;
  times: string[];
  formatoCampeonato: string;
  quantidadeTimesClassificam: number;
}

export interface CampeonatoFormValues {
  nome: string;
  dataInicio: string;
  dataFim: string;
  pontosVitoria: number;
  pontosDerrota: number;
  pontosEmpate: number;
}

export interface ConviteRequest {
  campeonatoId: string;
  timeId: string;
}

export interface ResponderConviteRequest {
  organizadorTimeId: string;
  aceito: boolean;
}

export interface ParticipacaoResponse {
  participacaoId: string;
  timeId: string;
  nomeTime: string;
  logoUrl: string | null;
  cidade: string;
  estado: string;
  convidadoEm: string;
  aceito: boolean | null;
}

export interface ConvitePendenteResponse {
  participacaoId: string;
  campeonatoId: string;
  nomeCampeonato: string;
  nomeTime: string;
  convidadoEm: string;
  dataInicio: string;
  dataFim: string;
  pontosVitoria: number;
  pontosDerrota: number;
  pontosEmpate: number;
  statusCampeonato: string;
}

export interface ConviteCampeonatoResponse {
  participacaoId: string;
  timeId: string;
  nomeTime: string;
  statusParticipacao: "Pendente" | "Aceito" | "Recusado";
  convidadoEm: string;
  respondidoEm: string | null;
}
