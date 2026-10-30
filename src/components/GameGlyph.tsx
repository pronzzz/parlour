import type { GameId } from '../games/types';

/** Tiny still-life of each game, for the index and previews. */
export function GameGlyph({ id, className = '' }: { id: GameId; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {GLYPHS[id]}
    </svg>
  );
}

const red = 'var(--p0)';
const ink = 'var(--p1)';

const GLYPHS: Record<GameId, React.ReactNode> = {
  noughts: (
    <g strokeLinecap="round" fill="none">
      <path d="M37 12v76M63 12v76M12 37h76M12 63h76" stroke="var(--line)" strokeWidth="3" />
      <path d="M17 17l13 13M30 17 17 30M70 70l13 13M83 70 70 83M44 44l12 12M56 44 44 56" stroke={red} strokeWidth="5" />
      <circle cx="76" cy="24" r="8" stroke={ink} strokeWidth="5" />
      <circle cx="24" cy="76" r="8" stroke={ink} strokeWidth="5" />
    </g>
  ),
  four: (
    <g>
      <rect x="6" y="14" width="88" height="76" rx="12" fill="var(--felt)" />
      {Array.from({ length: 16 }, (_, i) => {
        const c = i % 4;
        const r = Math.floor(i / 4);
        const fill = [12, 13, 9, 15, 14, 8, 10, 5].indexOf(i);
        return <circle key={i} cx={20 + c * 20} cy={28 + r * 17} r="7" fill={fill === -1 ? 'rgb(0 0 0 / .28)' : fill % 2 ? ink : red} />;
      })}
    </g>
  ),
  dots: (
    <g>
      <rect x="16" y="16" width="34" height="34" rx="4" fill={red} opacity=".18" />
      <path d="M16 16h34M16 16v34M50 16v34M16 50h34M50 50h34M84 16v34" stroke={red} strokeWidth="4" strokeLinecap="round" />
      <path d="M50 16h34M16 84h34M50 50v34" stroke={ink} strokeWidth="4" strokeLinecap="round" />
      {Array.from({ length: 9 }, (_, i) => <circle key={i} cx={16 + (i % 3) * 34} cy={16 + Math.floor(i / 3) * 34} r="5" fill="var(--ink)" />)}
    </g>
  ),
  reversi: (
    <g>
      <rect x="6" y="6" width="88" height="88" rx="12" fill="var(--felt)" />
      <path d="M50 6v88M6 50h88M28 6v88M72 6v88M6 28h88M6 72h88" stroke="rgb(0 0 0 / .2)" strokeWidth="1.5" />
      <circle cx="39" cy="39" r="9" fill="#f6f4ec" />
      <circle cx="61" cy="61" r="9" fill="#f6f4ec" />
      <circle cx="61" cy="39" r="9" fill="#1b1a17" />
      <circle cx="39" cy="61" r="9" fill="#1b1a17" />
      <circle cx="61" cy="17" r="9" fill="#1b1a17" />
    </g>
  ),
  chess: (
    <g>
      <rect x="6" y="6" width="44" height="44" fill="var(--sq-light)" />
      <rect x="50" y="6" width="44" height="44" fill="var(--sq-dark)" />
      <rect x="6" y="50" width="44" height="44" fill="var(--sq-dark)" />
      <rect x="50" y="50" width="44" height="44" fill="var(--sq-light)" />
      <text x="72" y="84" textAnchor="middle" fontSize="40" fontFamily="var(--font-chess)" fill="#1b1a17">{'♞︎'}</text>
      <text x="28" y="40" textAnchor="middle" fontSize="40" fontFamily="var(--font-chess)" fill="#f8f6ee">{'♛︎'}</text>
      <text x="28" y="40" textAnchor="middle" fontSize="40" fontFamily="var(--font-chess)" fill="#1b1a17">{'♕︎'}</text>
    </g>
  ),
  snakes: (
    <g>
      <rect x="6" y="6" width="88" height="88" rx="10" fill="var(--card)" stroke="var(--line)" strokeWidth="2" />
      <g stroke="var(--gold)" strokeWidth="3" strokeLinecap="round">
        <path d="M22 80 44 30M32 84 54 34" />
        <path d="M25 72h10M29 63h10M33 54h10M37 45h10M41 37h9" />
      </g>
      <path d="M78 20c-18 8 8 24-10 34s4 22-12 28" fill="none" stroke="var(--felt)" strokeWidth="6" strokeLinecap="round" />
      <circle cx="78" cy="20" r="5" fill="var(--felt)" />
      <circle cx="64" cy="76" r="5" fill={red} stroke="var(--card)" strokeWidth="2" />
    </g>
  ),
};
