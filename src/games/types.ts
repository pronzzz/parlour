export type Seat = 0 | 1;

export type GameId = 'noughts' | 'four' | 'dots' | 'reversi' | 'chess' | 'snakes';

export type Outcome =
  | { kind: 'playing'; turn: Seat }
  | { kind: 'won'; winner: Seat; line?: number[] }
  | { kind: 'draw' };

/** Pure rules for one game. `play` returns null for an illegal move. */
export interface Rules<S = unknown, M = unknown> {
  init(starter: Seat): S;
  play(state: S, move: M, seat: Seat): S | null;
  outcome(state: S): Outcome;
}

export interface BoardProps<S = unknown, M = unknown> {
  state: S;
  /** The seat looking at the board (null for spectators). Used for orientation and labels. */
  seat: Seat | null;
  /** True when the viewer may move right now. */
  live: boolean;
  outcome: Outcome;
  onMove(move: M): void;
}

export const other = (seat: Seat): Seat => (seat === 0 ? 1 : 0);

export const isInt = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
