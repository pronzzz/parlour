import { Chess, type Square } from 'chess.js';
import { other, type Rules, type Seat } from './types';

export interface ChessState {
  /** Moves in SAN, replayed so threefold repetition and the 50-move rule work. */
  moves: string[];
  /** The starter plays white. */
  white: Seat;
}

export interface ChessMove {
  from: string;
  to: string;
  promotion?: 'q' | 'r' | 'b' | 'n';
}

const cache = new WeakMap<ChessState, Chess>();

/** A chess.js game at the position after `state.moves`. Cached per state object; don't mutate. */
export function position(state: ChessState): Chess {
  let game = cache.get(state);
  if (!game) {
    game = new Chess();
    for (const san of state.moves) game.move(san);
    cache.set(state, game);
  }
  return game;
}

export const toMove = (state: ChessState): Seat => (state.moves.length % 2 === 0 ? state.white : other(state.white));

export const chess: Rules<ChessState, ChessMove> = {
  init: (starter) => ({ moves: [], white: starter }),
  play(state, move, seat) {
    if (chess.outcome(state).kind !== 'playing' || toMove(state) !== seat) return null;
    if (!move || typeof move.from !== 'string' || typeof move.to !== 'string') return null;
    const game = new Chess(position(state).fen());
    try {
      const done = game.move({ from: move.from as Square, to: move.to as Square, promotion: move.promotion ?? 'q' });
      return { ...state, moves: [...state.moves, done.san] };
    } catch {
      return null;
    }
  },
  outcome(state) {
    const game = position(state);
    if (game.isCheckmate()) return { kind: 'won', winner: other(toMove(state)) };
    if (game.isDraw() || game.isStalemate()) return { kind: 'draw' };
    return { kind: 'playing', turn: toMove(state) };
  },
};
