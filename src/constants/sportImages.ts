import { a } from "framer-motion/client";

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

export const SportImages: Record<SportKey, string> = {
  futebol: '/sports/futebol.png',
  volei: '/sports/volei.png',
  handebol: '/sports/handebol.png',
  futamericano: '/sports/futamericano.png',
  basquete: '/sports/basquete.png',
  tenis: '/sports/tenis.png',
  boxe: '/sports/boxe.png',
  natacao: '/sports/natacao.png',
  atletismo: '/sports/atletismo.png',
  ciclismo: '/sports/ciclismo.png',
};

// Tamanho padrão para todas as imagens
export const SPORT_IMAGE_SIZE = {
  width: 200,
  height: 180,
};
