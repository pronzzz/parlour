import { useEffect, useRef, useState, type FormEvent } from 'react';
import { GameGlyph } from '../components/GameGlyph';
import { Icon } from '../components/Icon';
import { Logo, Mark } from '../components/Logo';
import BlurText from '../components/reactbits/BlurText';
import Magnet from '../components/reactbits/Magnet';
import { ThemeToggle } from '../components/ThemeToggle';
import FourBoard from '../games/boards/Four';
import { GAMES, type GameInfo } from '../games/catalog';
import { four, type FourState } from '../games/rules';
import type { GameId } from '../games/types';
import { linkProps, navigate } from '../lib/route';

const REPO = 'https://github.com/pronzzz/parlour';
const prefetchNet = () => void import('../lib/net');

export default function Landing({ legacy }: { legacy?: boolean }) {
  const [creating, setCreating] = useState<GameId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deal = async (game: GameId) => {
    if (creating) return;
    setCreating(game);
    setError(null);
    try {
      const net = await import('../lib/net');
      navigate(`/t/${await net.createTable(game)}`);
    } catch (e) {
      console.error(e);
      setError('Couldn’t open a table just now. Check your connection, or play on this device instead.');
      setCreating(null);
    }
  };

  return (
    <div className="overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-transparent bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 text-sm">
            <a href="#games" className="btn-ghost hidden sm:inline-flex">Games</a>
            <a href="#how" className="btn-ghost hidden sm:inline-flex">How it works</a>
            <a href={REPO} className="btn-ghost w-9 px-0" aria-label="Parlour on GitHub" target="_blank" rel="noreferrer">
              <Icon name="github" />
            </a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {legacy && (
        <div className="anim-rise mx-auto mt-4 max-w-6xl px-4 sm:px-6" role="status">
          <p className="rounded-2xl border border-line bg-card px-4 py-3 text-sm">
            <strong className="font-medium">Global Arcade is now Parlour.</strong>{' '}
            <span className="text-mute">Old rooms have closed — open a fresh table below.</span>
          </p>
        </div>
      )}

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 md:grid-cols-12 md:pt-24 md:pb-28">
        <div className="md:col-span-7">
          <p className="eyebrow anim-focus">Six games · two players · one link</p>
          <h1 className="display mt-5 text-[clamp(52px,9.5vw,112px)]">
            <BlurText text="Board games for two," animateBy="words" delay={90} trigger="load" className="block" />
            <BlurText text="over a link." animateBy="words" delay={90} trigger="load" className="block text-felt italic dark:text-felt-ink" />
          </h1>
          <p className="anim-rise mt-7 max-w-md text-[17px] leading-relaxed text-mute [animation-delay:350ms]">
            Pick a game, send the link, play in real time. No accounts, no downloads, no ads — just a table and someone across it.
          </p>
          <div className="anim-rise mt-9 flex flex-wrap items-center gap-3 [animation-delay:500ms]">
            <Magnet padding={70} magnetStrength={3.5}>
              <a href="#games" className="btn-ink h-12 px-7" onPointerEnter={prefetchNet}>
                Deal a game <Icon name="arrow" size={16} />
              </a>
            </Magnet>
            <JoinByCode />
          </div>
        </div>
        <div className="md:col-span-5">
          <HeroTable />
        </div>
      </section>

      {/* Games */}
      <section id="games" className="scroll-mt-16 border-t border-line" onPointerEnter={prefetchNet}>
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-6 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="display text-[clamp(40px,6vw,72px)]">
              Pick a <em>game.</em>
            </h2>
            <p className="max-w-xs text-sm text-mute">Play online opens a table with its own link. Same device keeps it on this screen.</p>
          </div>
          {error && (
            <p className="anim-shake mt-6 rounded-2xl border border-p0/40 bg-p0/5 px-4 py-3 text-sm text-p0" role="alert">
              {error}
            </p>
          )}
        </div>
        <GameIndex onDeal={deal} creating={creating} />
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-16 border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-28">
          <p className="eyebrow">How it works</p>
          <ol className="mt-10 grid gap-12 md:grid-cols-3 md:gap-8">
            {[
              ['Pick a game.', 'Six classics, each with its real rules. Parlour checks every move so nobody has to argue.'],
              ['Send the link.', 'Every table gets a five-letter code and a link. Whoever opens it first takes the empty seat.'],
              ['Play.', 'Moves land on both screens instantly. Rematch, swap who starts, or switch games — the score keeps running.'],
            ].map(([title, body], i) => (
              <li key={title} className="group">
                <span className="display block text-[88px] text-line italic transition-colors duration-500 group-hover:text-p0">{i + 1}</span>
                <h3 className="mt-2 text-xl font-medium">{title}</h3>
                <p className="mt-2 max-w-xs text-mute">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Small print */}
      <section className="border-t border-line">
        <dl className="mx-auto grid max-w-6xl gap-px overflow-hidden px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {[
            ['No sign-up', 'You get an anonymous seat, kept in this browser so a refresh puts you back where you were.'],
            ['Real time', 'Each move is checked and written in one transaction, so two quick taps can’t both land.'],
            ['Runs on rematches', 'Who starts alternates every round. Wins and draws carry over until you leave.'],
            ['Same device', 'No second phone? Pass this one across the table and take turns.'],
            ['Small', 'The page you’re reading is light. The multiplayer bits only load when you sit down.'],
            ['Open source', 'MIT licensed. Read the rules engine, or add a seventh game.'],
          ].map(([t, d]) => (
            <div key={t} className="py-5 sm:pr-10">
              <dt className="eyebrow text-ink">{t}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-mute">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Footer />
    </div>
  );
}

function JoinByCode() {
  const [code, setCode] = useState('');
  const [bad, setBad] = useState(0);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== 5) {
      setBad((n) => n + 1);
      return;
    }
    navigate(`/t/${code}`);
  };
  return (
    <form key={bad} onSubmit={submit} className={`flex h-12 items-center rounded-full border border-line bg-card pr-1 pl-5 transition-colors focus-within:border-ink ${bad ? 'anim-shake' : ''}`}>
      <label htmlFor="code" className="sr-only">Table code</label>
      <input
        id="code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 5))}
        placeholder="CODE"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode="text"
        className="w-[7.5ch] bg-transparent font-mono text-sm tracking-[0.3em] placeholder:text-mute/60 focus:outline-none"
      />
      <button type="submit" className="flex h-10 items-center gap-1.5 rounded-full px-4 text-sm text-mute transition-colors hover:bg-line/60 hover:text-ink" aria-label="Join table">
        Join <Icon name="arrow" size={14} />
      </button>
    </form>
  );
}

/** A Four in a Row game that plays itself on the felt. */
const SCRIPT = [3, 3, 4, 4, 2, 5, 1];
function HeroTable() {
  const [state, setState] = useState<FourState>(() => four.init(0));
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      let s = four.init(0);
      SCRIPT.forEach((c, i) => (s = four.play(s, c, (i % 2) as 0 | 1) ?? s));
      setState(s);
      return;
    }
    const done = step >= SCRIPT.length;
    const t = setTimeout(
      () => {
        if (done) {
          setState(four.init(0));
          setStep(0);
        } else {
          setState((s) => four.play(s, SCRIPT[step], (step % 2) as 0 | 1) ?? s);
          setStep(step + 1);
        }
      },
      done ? 2600 : step === 0 ? 900 : 750,
    );
    return () => clearTimeout(t);
  }, [step]);
  const outcome = four.outcome(state);
  return (
    <figure className="anim-puff relative [animation-delay:200ms]">
      <div className="rounded-[32px] border border-line bg-card p-4 shadow-[0_40px_80px_-40px_rgb(0_0_0/0.35)] sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs">
            <span className="pulse-dot" aria-hidden /> Live table
          </span>
          <span className="font-mono text-[10px] tracking-[0.25em] text-mute">K7Q2X</span>
        </div>
        <div className="pointer-events-none [&>div]:!w-full">
          <FourBoard.Board state={state} seat={0} live={false} outcome={outcome} onMove={() => {}} />
        </div>
        <figcaption className="mt-4 flex items-center justify-between text-xs text-mute">
          <span>Four in a Row</span>
          <span className="anim-focus" key={outcome.kind}>{outcome.kind === 'won' ? 'Red wins, 1–0' : 'Red to move'}</span>
        </figcaption>
      </div>
    </figure>
  );
}

function GameIndex({ onDeal, creating }: { onDeal(g: GameId): void; creating: GameId | null }) {
  // Awwwards-style hover preview that trails the cursor (pointer devices only).
  const preview = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<GameId | null>(null);
  const move = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !preview.current) return;
    preview.current.style.transform = `translate(${e.clientX + 24}px, ${e.clientY - 90}px)`;
  };
  return (
    <div className="relative" onPointerMove={move} onPointerLeave={() => setHover(null)}>
      <ul className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {GAMES.map((g, i) => (
          <GameRow key={g.id} game={g} index={i} onDeal={onDeal} creating={creating} onHover={setHover} />
        ))}
      </ul>
      <div
        ref={preview}
        className={`pointer-events-none fixed top-0 left-0 z-40 hidden h-44 w-44 rounded-[28px] border border-line bg-card p-5 shadow-2xl transition-opacity duration-200 lg:block ${hover ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden
      >
        {hover && <GameGlyph key={hover} id={hover} className="anim-pop h-full w-full" />}
      </div>
    </div>
  );
}

function GameRow({ game, index, onDeal, creating, onHover }: { game: GameInfo; index: number; onDeal(g: GameId): void; creating: GameId | null; onHover(g: GameId | null): void }) {
  const busy = creating === game.id;
  return (
    <li className="group border-b border-line first:border-t" onPointerEnter={() => onHover(game.id)}>
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3 py-6 transition-[padding] duration-500 ease-[var(--ease-out-soft)] sm:gap-x-8 md:grid-cols-[3rem_1fr_7rem_auto] md:py-8 md:group-hover:pl-3">
        <span className="font-mono text-xs text-mute">0{index + 1}</span>
        <div className="min-w-0">
          <h3 className="display text-[clamp(30px,4.6vw,56px)] transition-colors duration-300 group-hover:italic">{game.name}</h3>
          <p className="mt-2 text-sm text-mute">{game.line}</p>
        </div>
        <GameGlyph id={game.id} className="h-14 w-14 md:hidden" />
        <span className="hidden font-mono text-[11px] text-mute md:block">{game.minutes}</span>
        <div className="col-span-3 flex flex-wrap items-center gap-2 md:col-span-1">
          <button type="button" className="btn-ink" onClick={() => onDeal(game.id)} disabled={creating !== null} aria-busy={busy}>
            {busy ? <span className="orbit mx-4 scale-75" aria-label="Opening a table" /> : <>Play online <Icon name="arrow" size={15} /></>}
          </button>
          <a {...linkProps(`/here/${game.id}`)} className="btn-line">
            Same device
          </a>
        </div>
      </div>
    </li>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pt-10 text-sm text-mute sm:px-6">
        <span className="flex items-center gap-2">
          <Mark size={16} /> Board games for two, over a link.
        </span>
        <span className="flex items-center gap-5">
          <a href={REPO} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-ink">
            <Icon name="github" size={15} /> Source
          </a>
          <a href="https://pronzzz.vercel.app" target="_blank" rel="noreferrer" className="hover:text-ink">
            Made by Pranav Dwivedi
          </a>
        </span>
      </div>
      <p className="display pointer-events-none -mb-[0.2em] text-center text-[clamp(96px,27vw,380px)] leading-none text-line/80 italic select-none" aria-hidden>
        Parlour
      </p>
    </footer>
  );
}
