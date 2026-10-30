import { loadGame } from '../games/catalog';
import { other, type GameId, type Outcome, type Rules, type Seat } from '../games/types';

/** One shared table: two seats, a running score, and the current round's game state. */
export interface Table {
  game: GameId;
  seats: [string, string | null];
  /** JSON of the game state (kept as a string so Firestore never sees nested arrays). */
  state: string;
  /** Increments on every write so stale moves are rejected. */
  v: number;
  round: number;
  /** Who moved first this round. Alternates every round. */
  starter: Seat;
  /** Wins for seat 0, wins for seat 1, draws. */
  score: [number, number, number];
  forfeit: Seat | null;
  ping: { seat: Seat; e: string; n: number } | null;
  /** Last heartbeat per seat, in ms. */
  seen?: Partial<Record<'0' | '1', number>>;
}

export type Action =
  | { t: 'move'; move: unknown }
  | { t: 'resign' }
  | { t: 'round'; game?: GameId }
  | { t: 'react'; e: string };

export const REACTIONS = ['👋', '🔥', '😮', '😅', '🤝'] as const;

export function outcomeOf(table: Table, rules: Rules): Outcome {
  if (table.forfeit !== null) return { kind: 'won', winner: other(table.forfeit) };
  return rules.outcome(JSON.parse(table.state));
}

function tally(score: Table['score'], out: Outcome): Table['score'] {
  const next: Table['score'] = [score[0], score[1], score[2]];
  if (out.kind === 'won') next[out.winner]++;
  if (out.kind === 'draw') next[2]++;
  return next;
}

export function freshTable(game: GameId, rules: Rules, host: string): Table {
  return {
    game,
    seats: [host, null],
    state: JSON.stringify(rules.init(0)),
    v: 0,
    round: 1,
    starter: 0,
    score: [0, 0, 0],
    forfeit: null,
    ping: null,
  };
}

/**
 * Apply one action from `seat`. Returns the fields to change, or null if the
 * action isn't allowed right now. Used by both online and same-device tables.
 */
export async function reduce(table: Table, action: Action, seat: Seat): Promise<Partial<Table> | null> {
  const { rules } = await loadGame(table.game);
  const before = outcomeOf(table, rules);

  switch (action.t) {
    case 'move': {
      if (before.kind !== 'playing' || table.seats[1] === null) return null;
      const next = rules.play(JSON.parse(table.state), action.move, seat);
      if (!next) return null;
      const state = JSON.stringify(next);
      const after = rules.outcome(next);
      return {
        state,
        v: table.v + 1,
        ...(after.kind !== 'playing' ? { score: tally(table.score, after) } : {}),
      };
    }
    case 'resign': {
      if (before.kind !== 'playing' || table.seats[1] === null) return null;
      return { forfeit: seat, v: table.v + 1, score: tally(table.score, { kind: 'won', winner: other(seat) }) };
    }
    case 'round': {
      const game = action.game ?? table.game;
      // A live game can't be thrown away — only an untouched board can be swapped for another game.
      const untouched = JSON.stringify(rules.init(table.starter)) === table.state && table.forfeit === null;
      if (before.kind === 'playing' && !untouched) return null;
      const starter = untouched ? table.starter : other(table.starter);
      const { rules: nextRules } = await loadGame(game);
      return {
        game,
        starter,
        round: untouched ? table.round : table.round + 1,
        state: JSON.stringify(nextRules.init(starter)),
        forfeit: null,
        v: table.v + 1,
      };
    }
    case 'react': {
      if (!(REACTIONS as readonly string[]).includes(action.e)) return null;
      return { ping: { seat, e: action.e, n: (table.ping?.n ?? 0) + 1 } };
    }
  }
}
