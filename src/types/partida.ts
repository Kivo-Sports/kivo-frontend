export type FormatoCampeonato = "PontosCorridos" | "MataMata" | "Hibrido";

export type FaseMataMata = "Nenhuma" | "Oitavas" | "Quartas" | "Semifinais" | "Final";

// GET /api/partida/tabela/{campeonatoId}
export interface TabelaClassificacaoResponse {
  posicao: number;
  timeId: string;
  nomeTime: string;
  logoUrl: string | null;
  pontos: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  golsFeitos: number;
  golsSofridos: number;
  saldoGols: number;
}

// Partida dentro de uma fase do chaveamento
export interface PartidaMataMataResponse {
  id: string;
  numeroJogoChave: number;
  timeCasa: string;
  timeVisitante: string;
  logoCasa: string | null;
  logoVisitante: string | null;
  golsCasa: number;
  golsVisitante: number;
  dataHora: string | null;
  finalizado: boolean;
}

// GET /api/partida/chaveamento/{campeonatoId}
export interface ChaveamentoResponse {
  fase: string;
  partidas: PartidaMataMataResponse[];
}

// GET /api/partida/jogos/{campeonatoId}
export interface JogoResponse {
  id: string;
  rodada: number;
  nomeTimeCasa: string;
  nomeTimeVisitante: string;
  logoTimeCasa: string | null;
  logoTimeVisitante: string | null;
  golsTimeCasa: number;
  golsTimeVisitante: number;
  dataHora: string | null;
  finalizado: boolean;
}

// GET /api/partida/{id}
export interface DetalhePartidaResponse {
  id: string;
  campeonatoId: string;
  rodada: number | null;
  fase: string;
  nomeTimeCasa: string;
  logoTimeCasa: string | null;
  nomeTimeVisitante: string;
  logoTimeVisitante: string | null;
  golsTimeCasa: number;
  golsTimeVisitante: number;
  dataHora: string | null;
  local: string;
  finalizado: boolean;
}

// PATCH /api/partida/{id}/atualizar-placar
export interface AtualizarPlacarRequest {
  partidaId: string;
  golsTimeCasa: number;
  golsTimeVisitante: number;
}

// PATCH /api/partida/{id}/agendar
export interface AgendarPartidaRequest {
  partidaId: string;
  dataHora: string | null;
  local: string;
}
