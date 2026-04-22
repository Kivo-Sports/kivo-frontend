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
}

export interface CampeonatoFormValues {
  nome: string;
  dataInicio: string;
  dataFim: string;
  pontosVitoria: number;
  pontosDerrota: number;
  pontosEmpate: number;
}
