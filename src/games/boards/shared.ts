import type { GameId, Seat } from '../types';

/** The colour a seat plays in most games. */
export const seatColor = (seat: Seat) => (seat === 0 ? 'var(--p0)' : 'var(--p1)');

const DARK = '#1b1a17';
const LIGHT = '#f6f4ec';

/** Swatch for a seat's pieces this round (chess and reversi use dark/light sets). */
export function swatch(game: GameId, seat: Seat, starter: Seat): string {
  if (game === 'chess') return seat === starter ? LIGHT : DARK;
  if (game === 'reversi') return seat === starter ? DARK : LIGHT;
  return seatColor(seat);
}

export const DISC = { dark: DARK, light: LIGHT };
