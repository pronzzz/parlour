import { useEffect, useRef, useState, type ReactNode } from 'react';
import ClickSpark, { type ClickSparkHandle } from '../components/reactbits/ClickSpark';
import Counter from '../components/reactbits/Counter';
import Magnet from '../components/reactbits/Magnet';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { GAMES, gameInfo, type LoadedGame } from '../games/catalog';
import { swatch } from '../games/boards/shared';
import type { GameId, Seat } from '../games/types';
import { useDocumentTitle, useTurnSignal } from '../lib/spells';
import { REACTIONS, outcomeOf, type Action, type Table } from '../lib/table';

export interface TableViewProps {
  table: Table;
  loaded: LoadedGame;
  /** Your seat online; null when watching. Ignored on a shared device. */
  seat: Seat | null;
  mode: 'online' | 'here';
  dispatch(action: Action): Promise<boolean>;
  /** Extra header controls (invite link etc). */
  actions?: ReactNode;
  /** Shown instead of the board footer while the second seat is empty. */
  waiting?: ReactNode;
  present?: boolean;
}

export function TableView({ table, loaded, seat, mode, dispatch, actions, waiting, present }: TableViewProps) {
  const info = gameInfo(table.game);
  const state = JSON.parse(table.state);
  const outcome = outcomeOf(table, loaded.rules);
  const sides = info.sides(table.starter);
  const here = mode === 'here';
  // On a shared device nobody owns a side, so boards keep their default orientation.
  const viewer: Seat | null = here ? null : seat;
  const seated = !here && seat !== null;
  const full = table.seats[1] !== null;
  const myTurn = outcome.kind === 'playing' && full && (here || (seated && outcome.turn === seat));
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);
  const spark = useRef<ClickSparkHandle>(null);

  useDocumentTitle(`${info.name} — Parlour`);
  useTurnSignal(!here && myTurn);

  // Celebrate a finished round once.
  const ended = outcome.kind !== 'playing';
  const celebrated = useRef(`${table.round}:${ended}`);
  useEffect(() => {
    const key = `${table.round}:${ended}`;
    if (ended && celebrated.current !== key && outcome.kind === 'won' && (here || outcome.winner === seat)) spark.current?.spark();
    celebrated.current = key;
  }, [ended, table.round, outcome, here, seat]);

  const send = async (action: Action) => {
    if (busy) return false;
    setBusy(true);
    try {
      const ok = await dispatch(action);
      if (!ok && action.t === 'move') setShake((n) => n + 1);
      return ok;
    } finally {
      setBusy(false);
    }
  };

  const name = (s: Seat) =>
    here || seat === null ? (s === 0 ? 'Player one' : 'Player two') : s === seat ? 'You' : full ? 'Them' : 'Empty seat';

  const status = (() => {
    if (!full) return 'Seat open';
    if (outcome.kind === 'draw') return 'A draw.';
    if (outcome.kind === 'won') {
      const by = table.forfeit !== null ? ' — resigned' : '';
      if (here || seat === null) return `Win for ${name(outcome.winner)}${by}.`;
      return outcome.winner === seat ? `You win${by && ' — they resigned'}.` : `They win${table.forfeit === seat ? ' — you resigned' : ''}.`;
    }
    if (here || seat === null) return `${name(outcome.turn)} to move`;
    return outcome.turn === seat ? 'Your move' : 'Their move';
  })();

  const { Board } = loaded;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line/70 bg-bg/85 px-4 backdrop-blur-md sm:px-6">
        <Logo />
        <div className="flex items-center gap-1">
          {actions}
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pt-6 pb-16 sm:pt-10">
        <div className="mb-2 flex items-center gap-2">
          <span className="eyebrow">Round {table.round}</span>
          <span className="eyebrow">·</span>
          <RulesButton name={info.name} rules={info.rules} />
        </div>

        {/* Scoreboard */}
        <div className="mb-6 grid w-full max-w-xl grid-cols-2 items-center gap-x-4 gap-y-4 sm:mb-8 sm:grid-cols-[1fr_auto_1fr]">
          <PlayerChip align="left" label={name(0)} side={sides[0]} color={swatch(table.game, 0, table.starter)} score={table.score[0]} active={outcome.kind === 'playing' && full && outcome.turn === 0} away={seated && full && seat === 1 && present === false} />
          <div className="col-span-2 row-start-2 text-center sm:col-span-1 sm:col-start-2 sm:row-start-1">
            <p key={status} className="display anim-focus text-[clamp(22px,4.5vw,34px)] italic" aria-live="polite">
              {status}
            </p>
            {table.score[2] > 0 && <p className="mt-1 font-mono text-[10px] text-mute">{table.score[2]} drawn</p>}
          </div>
          <PlayerChip align="right" label={name(1)} side={sides[1]} color={swatch(table.game, 1, table.starter)} score={table.score[1]} active={outcome.kind === 'playing' && full && outcome.turn === 1} away={seated && full && seat === 0 && present === false} />
        </div>

        {waiting && !full && <div className="mb-10 w-full max-w-xl">{waiting}</div>}

        <ClickSpark
          ref={spark}
          sparkColor={['var(--p0)', 'var(--gold)', 'var(--felt-hi)']}
          sparkCount={10}
          sparkRadius={28}
          disabled={!myTurn}
          className="w-full"
        >
          <div key={shake} className={shake ? 'anim-shake' : ''}>
            <div className={`transition-opacity duration-300 ${busy ? 'opacity-80' : ''} ${!full ? 'pointer-events-none opacity-40' : ''}`} aria-hidden={!full || undefined}>
              <Board state={state} seat={viewer} live={myTurn && !busy} outcome={outcome} onMove={(move) => void send({ t: 'move', move })} />
            </div>
          </div>
        </ClickSpark>

        <div className="mt-8 flex w-full max-w-xl flex-col items-center gap-5">
          {!full ? null : ended ? (
            <NextRound game={table.game} onAgain={(game) => void send({ t: 'round', game })} busy={busy} />
          ) : (
            <div className="flex w-full flex-wrap items-center justify-between gap-3">
              {seated && full ? <Reactions onReact={(e) => void dispatch({ t: 'react', e })} /> : <span />}
              {(seated || here) && full && (
                <ResignButton onResign={() => void send({ t: 'resign' })} />
              )}
            </div>
          )}
        </div>
        <ReactionBurst table={table} />
      </main>
    </div>
  );
}

function PlayerChip({ label, side, color, score, active, away, align }: { label: string; side: string; color: string; score: number; active: boolean; away: boolean; align: 'left' | 'right' }) {
  return (
    <div className={`row-start-1 flex min-w-0 items-center gap-2.5 sm:gap-3 ${align === 'right' ? 'col-start-2 flex-row-reverse text-right sm:col-start-3' : 'col-start-1'}`}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
        {active && <span className="absolute inset-0 rounded-full border-2 border-ink/70 anim-beat" aria-hidden />}
        <span className="h-5 w-5 rounded-full shadow-[inset_0_-2px_0_rgb(0_0_0/0.18),0_0_0_1.5px_var(--line)]" style={{ background: color }} />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
          {label}
          {away && <span className="font-mono text-[9px] tracking-wider text-mute uppercase">· away</span>}
        </p>
        <p className="truncate font-mono text-[10px] tracking-wider text-mute uppercase">{side}</p>
      </div>
      <span className={`ml-auto font-display text-3xl tabular-nums ${align === 'right' ? 'mr-auto ml-0' : ''}`}>
        <span className="sr-only">{score} {score === 1 ? 'win' : 'wins'}</span>
        <span aria-hidden>
          <Counter value={score} fontSize={30} textColor="currentColor" fontWeight={400} />
        </span>
      </span>
    </div>
  );
}

function RulesButton({ name, rules }: { name: string; rules: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="eyebrow inline-flex items-center gap-1 hover:text-ink" aria-expanded={open}>
        {name} <Icon name="info" size={12} />
      </button>
      {open && (
        <div className="anim-rise absolute top-6 left-1/2 z-20 w-72 -translate-x-1/2 rounded-2xl border border-line bg-card p-4 text-left shadow-xl" role="dialog" aria-label={`${name} rules`}>
          <ol className="space-y-2 text-sm">
            {rules.map((r, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-[10px] leading-5 text-mute">0{i + 1}</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </span>
  );
}

function ResignButton({ onResign }: { onResign(): void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button type="button" className={`btn-ghost ${armed ? 'text-p0 hover:text-p0' : ''}`} onClick={() => (armed ? onResign() : setArmed(true))}>
      <Icon name="flag" size={15} />
      {armed ? 'Tap again to resign' : 'Resign'}
    </button>
  );
}

function NextRound({ game, onAgain, busy }: { game: GameId; onAgain(game: GameId): void; busy: boolean }) {
  return (
    <div className="anim-rise flex w-full flex-col items-center gap-5">
      <Magnet padding={60} magnetStrength={4}>
        <button type="button" className="btn-ink h-12 px-7" disabled={busy} onClick={() => onAgain(game)}>
          <Icon name="again" size={16} /> Play again
        </button>
      </Magnet>
      <div className="flex flex-col items-center gap-2">
        <p className="eyebrow">or switch to</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {GAMES.filter((g) => g.id !== game).map((g) => (
            <button key={g.id} type="button" disabled={busy} className="rounded-full border border-line px-3 py-1.5 text-xs transition-colors hover:border-ink hover:bg-card" onClick={() => onAgain(g.id)}>
              {g.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Reactions({ onReact }: { onReact(e: string): void }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-line bg-card p-1" role="group" aria-label="Send a reaction">
      {REACTIONS.map((e) => (
        <button key={e} type="button" onClick={() => onReact(e)} className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 hover:bg-line/60 active:scale-95" aria-label={`React ${e}`}>
          {e}
        </button>
      ))}
    </div>
  );
}

/** Reactions float up from the bottom of the screen on both sides of the table. */
function ReactionBurst({ table }: { table: Table }) {
  const [bursts, setBursts] = useState<{ id: number; e: string; seat: Seat }[]>([]);
  const first = useRef(table.ping?.n ?? 0);
  const n = table.ping?.n ?? 0;
  useEffect(() => {
    if (!table.ping || n <= first.current) return;
    first.current = n;
    const b = { id: n, e: table.ping.e, seat: table.ping.seat };
    setBursts((list) => [...list.slice(-6), b]);
    const t = setTimeout(() => setBursts((list) => list.filter((x) => x.id !== b.id)), 1800);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 h-0" aria-hidden>
      {bursts.map((b) => (
        <span key={b.id} className="absolute text-4xl" style={{ left: b.seat === 0 ? '30%' : '70%', animation: 'float-up 1.8s var(--ease-out-soft) both' }}>
          {b.e}
        </span>
      ))}
    </div>
  );
}

