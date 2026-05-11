export interface CriarTimeRequest {
  organizadorTimeId: string;
  nome: string;
  cidade: string;
  estado: string;
  logo?: File;
}

export interface TimeResponse {
  id: string;
  organizadorTimeId: string;
  nome: string;
  cidade: string;
  estado: string;
  logoUrl: string;
  ativo: boolean;
  criadoEm: string;
}

export interface AtualizarTimeRequest {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  logo?: File;
}

export interface TimeFormValues {
  nome: string;
  cidade: string;
  estado: string;
}
