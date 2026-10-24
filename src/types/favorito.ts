// Favoritos do torcedor (times e campeonatos) + timeline de próximos jogos.

// Valores do enum EnumTipoFavorito no backend.
export const TIPO_FAVORITO = { Time: 0, Campeonato: 1 } as const;
export type TipoFavorito = "Time" | "Campeonato";

export interface FavoritoTimeItem {
  id: string;
  nome: string;
  logoUrl: string | null;
  cidade: string;
  estado: string;
  esporteNome?: string | null;
  esporteIcone?: string | null;
}

export interface FavoritoCampeonatoItem {
  id: string;
  nome: string;
  logoUrl: string | null;
  status: string;
  esporteNome?: string | null;
  esporteIcone?: string | null;
  dataInicio: string;
  dataFim: string;
}

export interface FavoritosResponse {
  times: FavoritoTimeItem[];
  campeonatos: FavoritoCampeonatoItem[];
}

export interface TimelineItem {
  partidaId: string;
  campeonatoId: string;
  campeonatoNome: string;
  timeCasa: string;
  timeVisitante: string;
  logoCasa: string | null;
  logoVisitante: string | null;
  dataHora: string | null;
  local: string | null;
  origem: string;
}

export interface FavoritoRequest {
  tipo: number; // TIPO_FAVORITO
  itemId: string;
}
