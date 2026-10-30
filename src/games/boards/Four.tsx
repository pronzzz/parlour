import { useState } from 'react';
import { FOUR_COLS, FOUR_ROWS, four, fourLanding, type FourState } from '../rules';
import type { BoardProps } from '../types';
import { seatColor } from './shared';

function Board({ state, live, outcome, onMove }: BoardProps<FourState, number>) {
  const [hover, setHover] = useState<number | null>(null);
  const line = outcome.kind === 'won' ? outcome.line ?? [] : [];
  const turn = outcome.kind === 'playing' ? outcome.turn : null;
  return (
    <div className="mx-auto w-[min(92vw,520px,calc((100dvh-250px)*1.1))] min-w-[280px]">
      {/* The next disc hovers over the chosen column. */}
      <div className="grid h-10 grid-cols-7 px-[3%]" aria-hidden>
        {Array.from({ length: FOUR_COLS }, (_, c) => (
          <div key={c} className="flex items-center justify-center">
            {live && hover === c && turn !== null && fourLanding(state.cells, c) !== null && (
              <span className="anim-pop block aspect-square w-[64%] rounded-full" style={{ background: seatColor(turn) }} />
            )}
          </div>
        ))}
      </div>
      <div
        className="felt relative grid grid-cols-7 gap-[2.2%] overflow-hidden rounded-[22px] p-[3%] shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_18px_40px_-18px_rgb(0_0_0/0.45)]"
        onMouseLeave={() => setHover(null)}
        role="grid"
        aria-label="Four in a row board"
      >
        {Array.from({ length: FOUR_COLS }, (_, c) => (
          <button
            key={c}
            type="button"
            disabled={!live || fourLanding(state.cells, c) === null}
            onClick={() => onMove(c)}
            onMouseEnter={() => setHover(c)}
            onFocus={() => setHover(c)}
            aria-label={`Drop in column ${c + 1}`}
            className="group grid grid-rows-6 gap-[2.2%] rounded-full transition-colors hover:bg-white/5 disabled:cursor-default"
          >
            {Array.from({ length: FOUR_ROWS }, (_, r) => {
              const i = r * FOUR_COLS + c;
              const cell = state.cells[i];
              const won = line.includes(i);
              return (
                <span key={r} className="relative block aspect-square rounded-full bg-black/25 shadow-[inset_0_2px_4px_rgb(0_0_0/0.35)]">
                  {cell !== null && (
                    <span
                      className={`absolute inset-0 rounded-full shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)] transition-opacity duration-500 ${won ? 'ring-[3px] ring-gold' : line.length ? 'opacity-45' : ''}`}
                      style={{
                        background: seatColor(cell),
                        ...(state.last === i
                          ? { animation: `four-drop ${0.25 + r * 0.06}s cubic-bezier(.4,0,.9,.6) both`, ['--from' as string]: `${-(r + 1) * 112}%` }
                          : {}),
                      }}
                    />
                  )}
                </span>
              );
            })}
          </button>
        ))}
      </div>
    </div>
  );
}

export default { rules: four, Board };
