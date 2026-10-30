import { linkProps } from '../lib/route';

/** Two seats at a table. On hover they swap places — a small nod to the rematch. */
export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className="group/mark shrink-0 overflow-visible">
      <circle cx="7" cy="12" r="5" className="fill-p0 transition-transform duration-500 ease-[var(--ease-spring)] group-hover/logo:translate-x-[10px]" />
      <circle cx="17" cy="12" r="5" className="fill-ink transition-transform duration-500 ease-[var(--ease-spring)] group-hover/logo:-translate-x-[10px]" />
    </svg>
  );
}

export function Logo() {
  return (
    <a {...linkProps('/')} className="group/logo flex items-center gap-2.5" aria-label="Parlour home">
      <Mark />
      <span className="display text-[26px] italic leading-none tracking-[-0.03em]">Parlour</span>
    </a>
  );
}
