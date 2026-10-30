import { describe, expect, it } from 'vitest';
import { chess } from './chess';
import {
  DOTS_N, dots, four, hEdge, noughts, reversi, reversiMoves, snakes, snakesCell, vEdge,
} from './rules';
import type { Rules, Seat } from './types';

function run<S, M>(rules: Rules<S, M>, starter: Seat, moves: M[]): S {
  let state = rules.init(starter);
  for (const m of moves) {
    const out = rules.outcome(state);
    if (out.kind !== 'playing') throw new Error('game already over');
    const next = rules.play(state, m, out.turn);
    if (!next) throw new Error(`illegal move ${JSON.stringify(m)}`);
    state = next;
  }
  return state;
}

describe('noughts', () => {
  it('finds a diagonal win', () => {
    const s = run(noughts, 0, [0, 1, 4, 2, 8]);
    expect(noughts.outcome(s)).toEqual({ kind: 'won', winner: 0, line: [0, 4, 8] });
  });
  it('rejects moves out of turn and on taken squares', () => {
    const s = noughts.init(1);
    expect(noughts.play(s, 0, 0)).toBeNull();
    const t = noughts.play(s, 0, 1)!;
    expect(noughts.play(t, 0, 0)).toBeNull();
  });
  it('calls a full board with no line a draw', () => {
    const s = run(noughts, 0, [0, 1, 2, 4, 3, 5, 7, 6, 8]);
    expect(noughts.outcome(s).kind).toBe('draw');
  });
});

describe('four in a row', () => {
  it('stacks discs and detects a vertical four', () => {
    const s = run(four, 0, [3, 4, 3, 4, 3, 4, 3]);
    expect(four.outcome(s)).toMatchObject({ kind: 'won', winner: 0 });
  });
  it('rejects a full column', () => {
    const s = run(four, 0, [0, 0, 0, 0, 0, 0]);
    expect(four.play(s, 0, 0)).toBeNull();
  });
});

describe('dots and boxes', () => {
  it('gives another turn after closing a box', () => {
    let s = dots.init(0);
    s = dots.play(s, hEdge(0, 0), 0)!;
    s = dots.play(s, hEdge(1, 0), 1)!;
    s = dots.play(s, vEdge(0, 0), 0)!;
    expect(s.turn).toBe(1);
    s = dots.play(s, vEdge(0, 1), 1)!;
    expect(s.boxes[0]).toBe(1);
    expect(s.turn).toBe(1);
  });
  it('ends when every box is taken', () => {
    let s = dots.init(0);
    const edges = s.edges.map((_, i) => i);
    for (const e of edges) {
      const out = dots.outcome(s);
      if (out.kind !== 'playing') break;
      s = dots.play(s, e, out.turn)!;
    }
    expect(dots.outcome(s).kind).not.toBe('playing');
    expect(s.boxes.filter((b) => b !== null)).toHaveLength(DOTS_N * DOTS_N);
  });
});

describe('reversi', () => {
  it('opens with four legal moves and flips', () => {
    const s = reversi.init(0);
    expect(reversiMoves(s.cells, 0)).toHaveLength(4);
    const t = reversi.play(s, 19, 0)!;
    expect(t.cells[27]).toBe(0);
    expect(t.turn).toBe(1);
  });
});

describe('snakes and ladders', () => {
  it('climbs ladders, slides down snakes and rolls again on a six', () => {
    let s = snakes.init(0);
    s = snakes.play(s, 4, 0)!;
    expect(s.pos[0]).toBe(25);
    expect(s.turn).toBe(1);
    s = snakes.play(s, 6, 1)!;
    expect(s.turn).toBe(1);
  });
  it('needs an exact roll to finish', () => {
    const s = { pos: [97, 0] as [number, number], turn: 0 as Seat, last: null };
    expect(snakes.play(s, 5, 0)!.pos[0]).toBe(97);
    expect(snakes.outcome(snakes.play(s, 3, 0)!)).toEqual({ kind: 'won', winner: 0 });
  });
  it('lays squares out boustrophedon', () => {
    expect(snakesCell(1)).toEqual({ col: 0, row: 9 });
    expect(snakesCell(11)).toEqual({ col: 9, row: 8 });
    expect(snakesCell(100)).toEqual({ col: 0, row: 0 });
  });
});

describe('chess', () => {
  it('spots a fool’s mate for black', () => {
    const s = run(chess, 0, [
      { from: 'f2', to: 'f3' }, { from: 'e7', to: 'e5' },
      { from: 'g2', to: 'g4' }, { from: 'd8', to: 'h4' },
    ]);
    expect(chess.outcome(s)).toEqual({ kind: 'won', winner: 1 });
  });
  it('lets the guest play white when they start', () => {
    const s = chess.init(1);
    expect(chess.play(s, { from: 'e2', to: 'e4' }, 0)).toBeNull();
    expect(chess.play(s, { from: 'e2', to: 'e4' }, 1)?.moves).toEqual(['e4']);
  });
});
