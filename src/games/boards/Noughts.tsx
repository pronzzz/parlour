import { noughts, type NoughtsState } from '../rules';
import type { BoardProps, Seat } from '../types';
import { seatColor } from './shared';

function Mark({ kind, seat, still }: { kind: 'x' | 'o'; seat: Seat; still?: boolean }) {
  const cls = still ? '' : 'anim-draw';
  return (
    <svg viewBox="0 0 100 100" className="h-[62%] w-[62%] overflow-visible" aria-hidden style={{ color: seatColor(seat) }}>
      {kind === 'x' ? (
        <g stroke="currentColor" strokeWidth="11" strokeLinecap="round" fill="none">
          <path d="M18 18 82 82" pathLength={1} className={cls} />
          <path d="M82 18 18 82" pathLength={1} className={cls} style={{ animationDelay: '120ms' }} />
        </g>
      ) : (
        <circle cx="50" cy="50" r="34" stroke="currentColor" strokeWidth="11" fill="none" pathLength={1} className={cls} transform="rotate(-90 50 50)" />
      )}
    </svg>
  );
}

function Board({ state, live, outcome, onMove }: BoardProps<NoughtsState, number>) {
  const line = outcome.kind === 'won' ? outcome.line ?? [] : [];
  const kindOf = (seat: Seat) => (seat === state.starter ? 'x' : 'o');
  return (
    <div className="relative mx-auto aspect-square w-[min(84vw,420px,calc(100dvh-240px))] min-w-[240px]">
      {/* The hash, drawn like pencil on paper. */}
      <svg viewBox="0 0 300 300" className="pointer-events-none absolute inset-0 text-line" aria-hidden>
        <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <path d="M100 8v284M200 8v284M8 100h284M8 200h284" />
        </g>
      </svg>
      <div className="relative grid h-full grid-cols-3 grid-rows-3" role="grid" aria-label="Noughts and crosses board">
        {state.cells.map((cell, i) => {
          const open = live && cell === null;
          const ghost = kindOf(outcome.kind === 'playing' ? outcome.turn : 0);
          return (
            <button
              key={i}
              type="button"
              disabled={!open}
              onClick={() => onMove(i)}
              aria-label={cell === null ? `Square ${i + 1}, empty` : `Square ${i + 1}, ${kindOf(cell) === 'x' ? 'cross' : 'nought'}`}
              className={`group relative flex items-center justify-center ${line.length && !line.includes(i) ? 'opacity-30 transition-opacity duration-500' : ''}`}
            >
              {cell !== null ? (
                <Mark kind={kindOf(cell)} seat={cell} />
              ) : open ? (
                <span className="flex h-full w-full items-center justify-center opacity-0 transition-opacity group-hover:opacity-20">
                  <Mark kind={ghost} seat={outcome.kind === 'playing' ? outcome.turn : 0} still />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default { rules: noughts, Board };
