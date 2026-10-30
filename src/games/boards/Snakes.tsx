import { useEffect, useRef, useState } from 'react';
import { Die } from '../../components/Die';
import { LADDERS, SNAKES, snakes, snakesCell, type SnakesState } from '../rules';
import type { BoardProps, Seat } from '../types';
import { seatColor } from './shared';

const centre = (n: number) => {
  const { col, row } = snakesCell(n);
  return { x: col * 10 + 5, y: row * 10 + 5 };
};

function Ladder({ from, to }: { from: number; to: number }) {
  const a = centre(from);
  const b = centre(to);
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const nx = (-(b.y - a.y) / len) * 1.7;
  const ny = ((b.x - a.x) / len) * 1.7;
  const rungs = Math.max(2, Math.floor(len / 3.2));
  return (
    <g className="stroke-gold" strokeWidth="0.7" strokeLinecap="round">
      <line x1={a.x + nx} y1={a.y + ny} x2={b.x + nx} y2={b.y + ny} />
      <line x1={a.x - nx} y1={a.y - ny} x2={b.x - nx} y2={b.y - ny} />
      {Array.from({ length: rungs }, (_, i) => {
        const t = (i + 0.5) / rungs;
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        return <line key={i} x1={x + nx} y1={y + ny} x2={x - nx} y2={y - ny} />;
      })}
    </g>
  );
}

function Snake({ head, tail }: { head: number; tail: number }) {
  const a = centre(head);
  const b = centre(tail);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const nx = (-dy / len) * Math.min(7, len / 3);
  const ny = (dx / len) * Math.min(7, len / 3);
  const d = `M${a.x} ${a.y} C ${a.x + dx * 0.33 + nx} ${a.y + dy * 0.33 + ny}, ${a.x + dx * 0.66 - nx} ${a.y + dy * 0.66 - ny}, ${b.x} ${b.y}`;
  return (
    <g>
      <path d={d} fill="none" className="stroke-felt" strokeWidth="2.6" strokeLinecap="round" />
      <path d={d} fill="none" className="stroke-felt-hi" strokeWidth="0.9" strokeLinecap="round" strokeDasharray="0.6 1.6" />
      <circle cx={a.x} cy={a.y} r="2.2" className="fill-felt" />
      <circle cx={a.x - 0.75} cy={a.y - 0.4} r="0.45" fill="#fff" />
      <circle cx={a.x + 0.75} cy={a.y - 0.4} r="0.45" fill="#fff" />
    </g>
  );
}

/** Where each token is drawn — lags the real state so a climb or slide plays out in two hops. */
function useShownPositions(state: SnakesState): [number, number] {
  const [shown, setShown] = useState<[number, number]>(state.pos);
  const seen = useRef(state.last?.n ?? 0);
  useEffect(() => {
    const last = state.last;
    if (!last || last.n === seen.current) {
      setShown(state.pos);
      return;
    }
    seen.current = last.n;
    const landing = last.from + last.roll > 100 ? last.from : last.from + last.roll;
    const mid: [number, number] = [state.pos[0], state.pos[1]];
    mid[last.seat] = landing;
    setShown(mid);
    if (landing === last.to) return;
    const t = setTimeout(() => setShown(state.pos), 650);
    return () => clearTimeout(t);
  }, [state]);
  return shown;
}

function Token({ seat, at, nudge }: { seat: Seat; at: number; nudge: boolean }) {
  if (at === 0) return null;
  const { col, row } = snakesCell(at);
  const off = nudge ? (seat === 0 ? -1.6 : 1.6) : 0;
  return (
    <span
      className="absolute z-10 block aspect-square w-[6.2%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card shadow-[0_3px_6px_rgb(0_0_0/0.35)] transition-[left,top] duration-500 ease-[var(--ease-spring)]"
      style={{ left: `${col * 10 + 5 + off}%`, top: `${row * 10 + 5 + off}%`, background: seatColor(seat) }}
      aria-hidden
    />
  );
}

function Board({ state, live, onMove }: BoardProps<SnakesState, number>) {
  const shown = useShownPositions(state);
  const last = state.last;
  const roll = () => {
    const r = new Uint8Array(1);
    // Rejection sampling keeps the six faces exactly even.
    do crypto.getRandomValues(r);
    while (r[0] >= 252);
    onMove((r[0] % 6) + 1);
  };
  const note = !last
    ? 'Roll to enter the board.'
    : last.via === 'ladder'
      ? `Ladder — up to ${last.to}.`
      : last.via === 'snake'
        ? `Snake — down to ${last.to}.`
        : last.from + last.roll > 100
          ? `Needs exactly ${100 - last.from}.`
          : last.roll === 6 && last.to !== 100
            ? 'A six — roll again.'
            : `Moved to ${last.to}.`;

  return (
    <div className="mx-auto w-[min(92vw,540px,calc(100dvh-300px))] min-w-[280px]">
      <div className="relative aspect-square overflow-hidden rounded-[18px] border border-line bg-card shadow-[0_18px_40px_-22px_rgb(0_0_0/0.35)]">
        <div className="absolute inset-0 grid grid-cols-10 grid-rows-10" aria-hidden>
          {Array.from({ length: 100 }, (_, i) => {
            const row = Math.floor(i / 10);
            const col = i % 10;
            const fromBottom = 9 - row;
            const n = fromBottom * 10 + (fromBottom % 2 === 0 ? col : 9 - col) + 1;
            return (
              <div key={n} className={`relative ${(row + col) % 2 ? 'bg-bg/70' : ''} ${n === 100 ? 'bg-gold/20' : ''}`}>
                <span className="absolute top-[6%] left-[8%] font-mono text-[clamp(6px,1.6vw,9px)] text-mute">{n}</span>
              </div>
            );
          })}
        </div>
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
          {Object.entries(LADDERS).map(([f, t]) => <Ladder key={f} from={+f} to={t} />)}
          {Object.entries(SNAKES).map(([h, t]) => <Snake key={h} head={+h} tail={t} />)}
        </svg>
        <Token seat={0} at={shown[0]} nudge={shown[0] === shown[1]} />
        <Token seat={1} at={shown[1]} nudge={shown[0] === shown[1]} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {last ? <Die value={last.roll} spin={last.n} size={48} tone={last.seat === 0 ? 'p0' : 'ink'} /> : <Die value={6} size={48} />}
          <p className="text-sm text-mute" aria-live="polite">{note}</p>
        </div>
        <button type="button" className="btn-ink" disabled={!live} onClick={roll}>
          Roll
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        Positions: first player {state.pos[0] || 'off the board'}, second player {state.pos[1] || 'off the board'}.
      </p>
    </div>
  );
}

export default { rules: snakes, Board };
