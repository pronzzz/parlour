import { useMemo, useState } from 'react';
import type { Square } from 'chess.js';
import { chess, position, toMove, type ChessMove, type ChessState } from '../chess';
import type { BoardProps } from '../types';

const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
const OUTLINE: Record<string, string> = { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' };
const FILES = 'abcdefgh';
const NAMES: Record<string, string> = { k: 'king', q: 'queen', r: 'rook', b: 'bishop', n: 'knight', p: 'pawn' };

function Piece({ type, color }: { type: string; color: 'w' | 'b' }) {
  // White pieces are a bone fill under an ink outline; black are solid ink. U+FE0E keeps iOS from emoji-fying them.
  return (
    <span className="relative block font-chess text-[min(9.6vw,52px)] leading-none select-none" aria-hidden>
      <span style={{ color: color === 'w' ? '#f8f6ee' : '#1b1a17' }}>{GLYPH[type]}{'︎'}</span>
      {color === 'w' && <span className="absolute inset-0 text-[#1b1a17]">{OUTLINE[type]}{'︎'}</span>}
    </span>
  );
}

function Board({ state, seat, live, onMove }: BoardProps<ChessState, ChessMove>) {
  const game = position(state);
  const [picked, setPicked] = useState<Square | null>(null);
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null);
  const flip = seat !== null && seat !== state.white;
  const myColor = toMove(state) === state.white ? 'w' : 'b';

  const targets = useMemo(
    () => (picked && live ? new Set(game.moves({ square: picked, verbose: true }).map((m) => m.to)) : new Set<string>()),
    [picked, live, game],
  );
  const last = game.history({ verbose: true }).at(-1);
  const checkSq = game.inCheck()
    ? game.board().flat().find((p) => p && p.type === 'k' && p.color === game.turn())?.square
    : undefined;

  const click = (sq: Square) => {
    if (!live) return;
    const piece = game.get(sq);
    if (picked && targets.has(sq)) {
      const moving = game.get(picked);
      if (moving?.type === 'p' && (sq[1] === '8' || sq[1] === '1')) {
        setPromo({ from: picked, to: sq });
        return;
      }
      onMove({ from: picked, to: sq });
      setPicked(null);
      return;
    }
    setPicked(piece && piece.color === myColor && sq !== picked ? sq : null);
  };

  const rows = flip ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1];
  const cols = flip ? [...FILES].reverse() : [...FILES];

  return (
    <div className="mx-auto w-[min(92vw,560px,calc(100dvh-230px))] min-w-[280px]">
      <div className="relative grid grid-cols-8 overflow-hidden rounded-[14px] shadow-[0_18px_40px_-18px_rgb(0_0_0/0.45)]" role="grid" aria-label="Chess board">
        {rows.map((rank, ri) =>
          cols.map((file, ci) => {
            const sq = `${file}${rank}` as Square;
            const piece = game.get(sq);
            const dark = (FILES.indexOf(file) + rank) % 2 === 1;
            const isLast = last && (last.from === sq || last.to === sq);
            const target = targets.has(sq);
            return (
              <button
                key={sq}
                type="button"
                onClick={() => click(sq)}
                aria-label={`${sq}${piece ? `, ${piece.color === 'w' ? 'white' : 'black'} ${NAMES[piece.type]}` : ''}${target ? ', move here' : ''}`}
                className="relative flex aspect-square items-center justify-center"
                style={{ background: dark ? 'var(--sq-dark)' : 'var(--sq-light)' }}
              >
                {isLast && <span className="absolute inset-0 bg-gold/35" aria-hidden />}
                {picked === sq && <span className="absolute inset-0 bg-gold/60" aria-hidden />}
                {checkSq === sq && <span className="absolute inset-0 bg-[radial-gradient(circle,var(--p0)_0%,transparent_70%)]" aria-hidden />}
                {piece && (
                  <span className={`relative ${last?.to === sq ? 'anim-pop' : ''}`}>
                    <Piece type={piece.type} color={piece.color} />
                  </span>
                )}
                {target && (
                  <span
                    aria-hidden
                    className={piece ? 'absolute inset-[6%] rounded-full border-[4px] border-black/25' : 'absolute h-[26%] w-[26%] rounded-full bg-black/25'}
                  />
                )}
                {ci === 0 && <span className="absolute top-0.5 left-1 font-mono text-[9px] opacity-60" style={{ color: dark ? 'var(--sq-light)' : 'var(--sq-dark)' }}>{rank}</span>}
                {ri === 7 && <span className="absolute right-1 bottom-0.5 font-mono text-[9px] opacity-60" style={{ color: dark ? 'var(--sq-light)' : 'var(--sq-dark)' }}>{file}</span>}
              </button>
            );
          }),
        )}
        {promo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
            <div className="anim-puff flex gap-2 rounded-2xl bg-card p-2 shadow-xl">
              {(['q', 'r', 'b', 'n'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className="flex h-16 w-16 items-center justify-center rounded-xl hover:bg-line"
                  aria-label={`Promote to ${{ q: 'queen', r: 'rook', b: 'bishop', n: 'knight' }[p]}`}
                  onClick={() => {
                    onMove({ ...promo, promotion: p });
                    setPromo(null);
                    setPicked(null);
                  }}
                >
                  <Piece type={p} color={myColor} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <MoveList moves={state.moves} />
    </div>
  );
}

function MoveList({ moves }: { moves: string[] }) {
  if (!moves.length) return <p className="mt-4 text-center font-mono text-[11px] text-mute">White to move.</p>;
  const pairs: string[] = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push(`${i / 2 + 1}. ${moves[i]}${moves[i + 1] ? ` ${moves[i + 1]}` : ''}`);
  return (
    <p className="mt-4 line-clamp-2 text-center font-mono text-[11px] leading-relaxed text-mute" aria-label="Moves">
      {pairs.slice(-8).join('   ')}
    </p>
  );
}

export default { rules: chess, Board };
