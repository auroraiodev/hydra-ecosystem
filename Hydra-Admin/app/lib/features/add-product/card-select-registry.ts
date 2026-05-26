import type { ImportationCard } from './types';

type CardSelectHandler = (card: ImportationCard) => void;

let handler: CardSelectHandler | null = null;

export function registerCardSelectHandler(h: CardSelectHandler): () => void {
  handler = h;
  return () => {
    handler = null;
  };
}

export function callCardSelectHandler(card: ImportationCard): void {
  handler?.(card);
}

export function hasCardSelectHandler(): boolean {
  return handler !== null;
}
