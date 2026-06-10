export interface EsporteResponse {
  id: string;
  nome: string;
  icone: string;
  ativo: boolean;
  criadoEm: string;
}

export interface CriarEsporteRequest {
  nome: string;
  icone: string;
}

export interface EditarEsporteRequest {
  id: string;
  nome: string;
  icone: string;
  ativo: boolean;
}
