import { isInt, other, type Outcome, type Rules, type Seat } from './types';

type Cell = Seat | null;

/* ------------------------------------------------------------------ */
/* Noughts & Crosses                                                   */
/* ------------------------------------------------------------------ */

export interface NoughtsState {
  cells: Cell[];
  turn: Seat;
  /** The starter plays crosses. */
  starter: Seat;
}

const LINES3 = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

export const noughts: Rules<NoughtsState, number> = {
  init: (starter) => ({ cells: Array(9).fill(null), turn: starter, starter }),
  play(state, move, seat) {
    if (noughts.outcome(state).kind !== 'playing' || state.turn !== seat) return null;
    if (!isInt(move, 0, 8) || state.cells[move] !== null) return null;
    const cells = state.cells.slice();
    cells[move] = seat;
    return { ...state, cells, turn: other(seat) };
  },
  outcome(state) {
    for (const line of LINES3) {
      const [a, b, c] = line;
      const v = state.cells[a];
      if (v !== null && v === state.cells[b] && v === state.cells[c]) return { kind: 'won', winner: v, line };
    }
    if (state.cells.every((c) => c !== null)) return { kind: 'draw' };
    return { kind: 'playing', turn: state.turn };
  },
};

/* ------------------------------------------------------------------ */
/* Four in a Row — 7 columns × 6 rows, discs fall to the lowest gap     */
/* ------------------------------------------------------------------ */

export const FOUR_COLS = 7;
export const FOUR_ROWS = 6;

export interface FourState {
  /** Row-major, row 0 at the top. */
  cells: Cell[];
  turn: Seat;
  last: number | null;
}

export function fourLanding(cells: Cell[], col: number): number | null {
  for (let r = FOUR_ROWS - 1; r >= 0; r--) {
    const i = r * FOUR_COLS + col;
    if (cells[i] === null) return i;
  }
  return null;
}

function fourLine(cells: Cell[]): { winner: Seat; line: number[] } | null {
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
  for (let r = 0; r < FOUR_ROWS; r++) {
    for (let c = 0; c < FOUR_COLS; c++) {
      const v = cells[r * FOUR_COLS + c];
      if (v === null) continue;
      for (const [dr, dc] of dirs) {
        const line = [r * FOUR_COLS + c];
        for (let k = 1; k < 4; k++) {
          const rr = r + dr * k;
          const cc = c + dc * k;
          if (rr < 0 || rr >= FOUR_ROWS || cc < 0 || cc >= FOUR_COLS) break;
          if (cells[rr * FOUR_COLS + cc] !== v) break;
          line.push(rr * FOUR_COLS + cc);
        }
        if (line.length === 4) return { winner: v, line };
      }
    }
  }
  return null;
}

export const four: Rules<FourState, number> = {
  init: (starter) => ({ cells: Array(FOUR_COLS * FOUR_ROWS).fill(null), turn: starter, last: null }),
  play(state, move, seat) {
    if (four.outcome(state).kind !== 'playing' || state.turn !== seat) return null;
    if (!isInt(move, 0, FOUR_COLS - 1)) return null;
    const at = fourLanding(state.cells, move);
    if (at === null) return null;
    const cells = state.cells.slice();
    cells[at] = seat;
    return { cells, turn: other(seat), last: at };
  },
  outcome(state) {
    const win = fourLine(state.cells);
    if (win) return { kind: 'won', ...win };
    if (state.cells.every((c) => c !== null)) return { kind: 'draw' };
    return { kind: 'playing', turn: state.turn };
  },
};

/* ------------------------------------------------------------------ */
/* Dots & Boxes — 5 × 5 boxes. Closing a box earns another turn.        */
/* ------------------------------------------------------------------ */

export const DOTS_N = 5;
/** Horizontal edges come first: (N+1) rows × N. Then vertical: N rows × (N+1). */
export const DOTS_H = (DOTS_N + 1) * DOTS_N;
export const DOTS_EDGES = DOTS_H * 2;

export interface DotsState {
  edges: Cell[];
  boxes: Cell[];
  turn: Seat;
}

export const hEdge = (r: number, c: number) => r * DOTS_N + c;
export const vEdge = (r: number, c: number) => DOTS_H + r * (DOTS_N + 1) + c;
const boxEdges = (r: number, c: number) => [hEdge(r, c), hEdge(r + 1, c), vEdge(r, c), vEdge(r, c + 1)];

export const dots: Rules<DotsState, number> = {
  init: (starter) => ({
    edges: Array(DOTS_EDGES).fill(null),
    boxes: Array(DOTS_N * DOTS_N).fill(null),
    turn: starter,
  }),
  play(state, move, seat) {
    if (dots.outcome(state).kind !== 'playing' || state.turn !== seat) return null;
    if (!isInt(move, 0, DOTS_EDGES - 1) || state.edges[move] !== null) return null;
    const edges = state.edges.slice();
    edges[move] = seat;
    const boxes = state.boxes.slice();
    let closed = 0;
    for (let r = 0; r < DOTS_N; r++) {
      for (let c = 0; c < DOTS_N; c++) {
        const b = r * DOTS_N + c;
        if (boxes[b] !== null) continue;
        const sides = boxEdges(r, c);
        if (sides.includes(move) && sides.every((e) => edges[e] !== null)) {
          boxes[b] = seat;
          closed++;
        }
      }
    }
    return { edges, boxes, turn: closed ? seat : other(seat) };
  },
  outcome(state) {
    if (state.boxes.some((b) => b === null)) return { kind: 'playing', turn: state.turn };
    const a = state.boxes.filter((b) => b === 0).length;
    const b = state.boxes.length - a;
    if (a === b) return { kind: 'draw' };
    return { kind: 'won', winner: a > b ? 0 : 1 };
  },
};

/* ------------------------------------------------------------------ */
/* Reversi — 8 × 8. Turns pass automatically when you have no move.     */
/* ------------------------------------------------------------------ */

export interface ReversiState {
  cells: Cell[];
  turn: Seat;
  /** The starter plays the dark discs. */
  starter: Seat;
  last: number | null;
  /** Discs turned by the last move, for the flip animation. */
  flips: number[];
  passed: boolean;
}

const DIRS8 = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

export function reversiFlips(cells: Cell[], at: number, seat: Seat): number[] {
  if (cells[at] !== null) return [];
  const r0 = Math.floor(at / 8);
  const c0 = at % 8;
  const flips: number[] = [];
  for (const [dr, dc] of DIRS8) {
    const run: number[] = [];
    let r = r0 + dr;
    let c = c0 + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && cells[r * 8 + c] === other(seat)) {
      run.push(r * 8 + c);
      r += dr;
      c += dc;
    }
    if (run.length && r >= 0 && r < 8 && c >= 0 && c < 8 && cells[r * 8 + c] === seat) flips.push(...run);
  }
  return flips;
}

export const reversiMoves = (cells: Cell[], seat: Seat) =>
  cells.flatMap((_, i) => (reversiFlips(cells, i, seat).length ? [i] : []));

export const reversi: Rules<ReversiState, number> = {
  init(starter) {
    const cells: Cell[] = Array(64).fill(null);
    const dark = starter;
    const light = other(starter);
    cells[27] = light;
    cells[36] = light;
    cells[28] = dark;
    cells[35] = dark;
    return { cells, turn: starter, starter, last: null, flips: [], passed: false };
  },
  play(state, move, seat) {
    if (reversi.outcome(state).kind !== 'playing' || state.turn !== seat) return null;
    if (!isInt(move, 0, 63)) return null;
    const flips = reversiFlips(state.cells, move, seat);
    if (!flips.length) return null;
    const cells = state.cells.slice();
    cells[move] = seat;
    for (const f of flips) cells[f] = seat;
    const next = other(seat);
    const nextCanMove = reversiMoves(cells, next).length > 0;
    return { ...state, cells, last: move, flips, turn: nextCanMove ? next : seat, passed: !nextCanMove };
  },
  outcome(state) {
    if (reversiMoves(state.cells, state.turn).length) return { kind: 'playing', turn: state.turn };
    const a = state.cells.filter((c) => c === 0).length;
    const b = state.cells.filter((c) => c === 1).length;
    if (a === b) return { kind: 'draw' };
    return { kind: 'won', winner: a > b ? 0 : 1 };
  },
};

/* ------------------------------------------------------------------ */
/* Snakes & Ladders — exact landing on 100, a six rolls again.          */
/* ------------------------------------------------------------------ */

export const LADDERS: Record<number, number> = { 4: 25, 13: 46, 33: 49, 42: 63, 50: 69, 62: 81, 74: 92 };
export const SNAKES: Record<number, number> = { 27: 5, 40: 3, 43: 18, 54: 31, 66: 45, 76: 58, 89: 53, 99: 41 };

export interface SnakesState {
  /** 0 = waiting off the board. */
  pos: [number, number];
  turn: Seat;
  last: { seat: Seat; roll: number; from: number; to: number; via: 'snake' | 'ladder' | null; n: number } | null;
}

export const snakes: Rules<SnakesState, number> = {
  init: (starter) => ({ pos: [0, 0], turn: starter, last: null }),
  play(state, roll, seat) {
    if (snakes.outcome(state).kind !== 'playing' || state.turn !== seat) return null;
    if (!isInt(roll, 1, 6)) return null;
    const from = state.pos[seat];
    let to = from + roll > 100 ? from : from + roll;
    let via: 'snake' | 'ladder' | null = null;
    if (LADDERS[to]) {
      to = LADDERS[to];
      via = 'ladder';
    } else if (SNAKES[to]) {
      to = SNAKES[to];
      via = 'snake';
    }
    const pos: [number, number] = [state.pos[0], state.pos[1]];
    pos[seat] = to;
    const again = roll === 6 && to !== 100;
    return { pos, turn: again ? seat : other(seat), last: { seat, roll, from, to, via, n: (state.last?.n ?? 0) + 1 } };
  },
  outcome(state) {
    if (state.pos[0] === 100) return { kind: 'won', winner: 0 };
    if (state.pos[1] === 100) return { kind: 'won', winner: 1 };
    return { kind: 'playing', turn: state.turn };
  },
};

/** Board square (1–100) → column/row from the top-left, snaking from the bottom-left. */
export function snakesCell(n: number): { col: number; row: number } {
  const fromBottom = Math.floor((n - 1) / 10);
  const k = (n - 1) % 10;
  return { col: fromBottom % 2 === 0 ? k : 9 - k, row: 9 - fromBottom };
}

export type { Outcome };
