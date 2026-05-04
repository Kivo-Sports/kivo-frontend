export type SportKey =
  | 'futebol'
  | 'volei'
  | 'handebol'
  | 'futamericano'
  | 'basquete'
  | 'tenis'
  | 'boxe'
  | 'natacao'
  | 'atletismo'
  | 'ciclismo';

/**
 * Mapeamento das imagens de cada modalidade esportiva.
 *
 * Pasta:  /public/sports/
 * Formato: PNG com fundo transparente
 * Tamanho: 128 × 128 px  (exibido em 64–96 px, 128 garante nitidez em telas retina)
 *
 * Arquivos esperados:
 *   /public/sports/futebol.png
 *   /public/sports/volei.png
 *   /public/sports/handebol.png
 *   /public/sports/futamericano.png
 *   /public/sports/basquete.png
 *   /public/sports/tenis.png
 *   /public/sports/boxe.png
 *   /public/sports/natacao.png
 *   /public/sports/atletismo.png
 *   /public/sports/ciclismo.png
 */
export const SportImages: Record<SportKey, string> = {
  futebol:      '/sports/futebol.png',
  volei:        '/sports/volei.png',
  handebol:     '/sports/handebol.png',
  futamericano: '/sports/futamericano.png',
  basquete:     '/sports/basquete.png',
  tenis:        '/sports/tenis.png',
  boxe:         '/sports/boxe.png',
  natacao:      '/sports/natacao.png',
  atletismo:    '/sports/atletismo.png',
  ciclismo:     '/sports/ciclismo.png',
};

/** Dimensões de referência das imagens (width × height em pixels). */
export const SPORT_IMAGE_SIZE = { width: 128, height: 128 } as const;
