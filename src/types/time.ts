export interface CriarTimeRequest {
  nome: string;
  cidade: string;
  estado: string;
  logoUrl?: string;
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

export interface TimeFormValues {
  nome: string;
  cidade: string;
  estado: string;
  logoUrl?: string;
}
