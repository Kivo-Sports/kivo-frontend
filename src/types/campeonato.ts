export interface CriarCampeonatoRequest {
  organizadorCampeonatoId: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  pontosVitoria: number;
  pontosDerrota: number;
  pontosEmpate: number;
}

export interface CampeonatoResponse {
  id: string;
  organizadorCampeonatoId: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  status: string;
  totalTimes: number;
  criadoEm: string;
  pontosVitoria: number;
  pontosDerrota: number;
  pontosEmpate: number;
  times: string[];
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
