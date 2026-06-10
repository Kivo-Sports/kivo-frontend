export interface CriarTimeRequest {
  organizadorTimeId: string;
  esporteId: string;
  nome: string;
  cidade: string;
  estado: string;
  logo?: File;
}

export interface TimeResponse {
  id: string;
  organizadorTimeId: string;
  esporteId: string;
  esporteNome?: string | null;
  esporteIcone?: string | null;
  nome: string;
  cidade: string;
  estado: string;
  logoUrl: string;
  ativo: boolean;
  criadoEm: string;
}

export interface AtualizarTimeRequest {
  id: string;
  esporteId: string;
  nome: string;
  cidade: string;
  estado: string;
  logo?: File;
}

export interface TimeFormValues {
  nome: string;
  cidade: string;
  estado: string;
  esporteId: string;
}
