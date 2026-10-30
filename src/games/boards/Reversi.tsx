import { reversi, reversiMoves, type ReversiState } from '../rules';
import type { BoardProps, Seat } from '../types';
import { DISC } from './shared';

function Board({ state, live, outcome, onMove }: BoardProps<ReversiState, number>) {
  const turn = outcome.kind === 'playing' ? outcome.turn : null;
  const legal = new Set(live && turn !== null ? reversiMoves(state.cells, turn) : []);
  const tone = (seat: Seat) => (seat === state.starter ? DISC.dark : DISC.light);
  const flipped = new Set(state.flips ?? []);
  return (
    <div className="felt mx-auto grid w-[min(92vw,520px,calc(100dvh-230px))] min-w-[280px] grid-cols-8 gap-px overflow-hidden rounded-[18px] p-[2.5%] shadow-[0_18px_40px_-18px_rgb(0_0_0/0.45)]" role="grid" aria-label="Reversi board">
      {state.cells.map((cell, i) => {
        const can = legal.has(i);
        return (
          <button
            key={i}
            type="button"
            disabled={!can}
            onClick={() => onMove(i)}
            aria-label={`${'abcdefgh'[i % 8]}${8 - Math.floor(i / 8)}${cell === null ? (can ? ', playable' : '') : cell === state.starter ? ', dark' : ', light'}`}
            className="group relative flex aspect-square items-center justify-center border border-black/15 [perspective:300px]"
          >
            {cell !== null ? (
              <span
                className={`block h-[78%] w-[78%] rounded-full shadow-[inset_0_-3px_0_rgb(0_0_0/0.25),0_2px_3px_rgb(0_0_0/0.3)] ${state.last === i ? 'anim-pop' : flipped.has(i) ? 'anim-flip' : ''}`}
                style={{ background: tone(cell), animationDelay: flipped.has(i) ? '120ms' : undefined }}
              />
            ) : can && turn !== null ? (
              <span className="block h-[22%] w-[22%] rounded-full opacity-45 transition-all group-hover:h-[70%] group-hover:w-[70%] group-hover:opacity-50" style={{ background: tone(turn) }} />
            ) : null}
            {state.last === i && <span className="absolute h-1.5 w-1.5 rounded-full bg-gold" aria-hidden />}
          </button>
        );
      })}
    </div>
  );
}

export default { rules: reversi, Board };
