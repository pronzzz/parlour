const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[26, 26], [50, 50], [74, 74]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[26, 26], [74, 26], [50, 50], [26, 74], [74, 74]],
  6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]],
};

/** A flat die face. `spin` replays the roll animation whenever it changes. */
export function Die({ value, size = 56, spin, tone = 'ink' }: { value: number; size?: number; spin?: number | string; tone?: 'ink' | 'p0' }) {
  return (
    <svg
      key={spin}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Die showing ${value}`}
      className={`${spin === undefined ? '' : 'anim-puff'} drop-shadow-[0_6px_10px_rgb(0_0_0/0.18)]`}
    >
      <rect x="4" y="4" width="92" height="92" rx="22" className="fill-card stroke-line" strokeWidth="2" />
      {(PIPS[value] ?? []).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="8.5" className={tone === 'p0' ? 'fill-p0' : 'fill-ink'} />
      ))}
    </svg>
  );
}
