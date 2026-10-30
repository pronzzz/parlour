import { DOTS_N, dots, hEdge, vEdge, type DotsState } from '../rules';
import type { BoardProps } from '../types';
import { seatColor } from './shared';

const GAP = 60;
const PAD = 14;
const SIZE = GAP * DOTS_N + PAD * 2;

function Board({ state, live, outcome, onMove }: BoardProps<DotsState, number>) {
  const turn = outcome.kind === 'playing' ? outcome.turn : 0;
  const edge = (e: number, x1: number, y1: number, x2: number, y2: number, label: string) => {
    const owner = state.edges[e];
    const open = live && owner === null;
    return (
      <g key={e}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="7" strokeLinecap="round" className={owner === null ? 'stroke-line' : ''} style={owner === null ? undefined : { stroke: seatColor(owner) }} />
        {open && (
          <g className="group cursor-pointer" role="button" tabIndex={0} aria-label={label} onClick={() => onMove(e)} onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && onMove(e)}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="26" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="7" strokeLinecap="round" className="opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60" style={{ stroke: seatColor(turn) }} />
          </g>
        )}
      </g>
    );
  };

  const edges = [];
  for (let r = 0; r <= DOTS_N; r++)
    for (let c = 0; c < DOTS_N; c++) {
      const y = PAD + r * GAP;
      edges.push(edge(hEdge(r, c), PAD + c * GAP + 9, y, PAD + (c + 1) * GAP - 9, y, `Line across, row ${r + 1}, gap ${c + 1}`));
    }
  for (let r = 0; r < DOTS_N; r++)
    for (let c = 0; c <= DOTS_N; c++) {
      const x = PAD + c * GAP;
      edges.push(edge(vEdge(r, c), x, PAD + r * GAP + 9, x, PAD + (r + 1) * GAP - 9, `Line down, column ${c + 1}, gap ${r + 1}`));
    }

  const tally = [state.boxes.filter((b) => b === 0).length, state.boxes.filter((b) => b === 1).length];
  return (
    <div>
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-[min(88vw,460px,calc(100dvh-250px))] min-w-[260px] select-none" role="grid" aria-label="Dots and boxes board">
      {state.boxes.map((owner, b) => {
        if (owner === null) return null;
        const r = Math.floor(b / DOTS_N);
        const c = b % DOTS_N;
        return (
          <g key={`b${b}`} className="anim-pop" style={{ transformOrigin: `${PAD + c * GAP + GAP / 2}px ${PAD + r * GAP + GAP / 2}px` }}>
            <rect x={PAD + c * GAP + 8} y={PAD + r * GAP + 8} width={GAP - 16} height={GAP - 16} rx="8" style={{ fill: seatColor(owner), opacity: 0.16 }} />
            <circle cx={PAD + c * GAP + GAP / 2} cy={PAD + r * GAP + GAP / 2} r="7" style={{ fill: seatColor(owner) }} />
          </g>
        );
      })}
      {edges}
      {Array.from({ length: (DOTS_N + 1) ** 2 }, (_, i) => (
        <circle key={`d${i}`} cx={PAD + (i % (DOTS_N + 1)) * GAP} cy={PAD + Math.floor(i / (DOTS_N + 1)) * GAP} r="5.5" className="fill-ink" />
      ))}
    </svg>
    <p className="mt-3 text-center font-mono text-[11px] text-mute" aria-live="polite">
      Boxes <span style={{ color: seatColor(0) }}>{tally[0]}</span> – <span style={{ color: seatColor(1) }}>{tally[1]}</span>
    </p>
    </div>
  );
}

export default { rules: dots, Board };
