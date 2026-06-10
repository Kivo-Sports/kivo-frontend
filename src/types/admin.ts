// Tipos usados exclusivamente pelo painel administrativo.

export interface OrganizadorOption {
  id: string;
  nome: string;
  email: string;
}

// Valor numérico do enum EnumFaseMataMata no backend.
export const FASE_MATA_MATA: Record<string, number> = {
  Nenhuma: 0,
  Oitavas: 1,
  Quartas: 2,
  Semifinais: 3,
  Final: 4,
};

// POST /api/partida/admin
export interface CriarPartidaAdminRequest {
  campeonatoId: string;
  timeCasaId?: string | null;
  timeVisitanteId?: string | null;
  golsTimeCasa: number;
  golsTimeVisitante: number;
  dataHora?: string | null;
  local?: string | null;
  finalizado: boolean;
  rodada?: number | null;
  fase: number;
  numeroJogoChave: number;
}

// PUT /api/partida/{id}/admin
export interface EditarPartidaAdminRequest {
  id: string;
  timeCasaId?: string | null;
  timeVisitanteId?: string | null;
  dataHora?: string | null;
  local?: string | null;
  rodada?: number | null;
  fase: number;
  numeroJogoChave: number;
}

// PATCH /api/partida/{id}/admin-placar
export interface AtualizarPlacarAdminRequest {
  partidaId: string;
  golsTimeCasa: number;
  golsTimeVisitante: number;
}

// PATCH /api/campeonato/{id}/reatribuir
export interface ReatribuirCampeonatoRequest {
  id: string;
  novoOrganizadorCampeonatoId: string;
}

// PATCH /api/time/{id}/reatribuir
export interface ReatribuirTimeRequest {
  id: string;
  novoOrganizadorTimeId: string;
}
