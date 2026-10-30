import { useEffect, useRef, useState } from 'react';
import { Die } from '../components/Die';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import DecryptedText from '../components/reactbits/DecryptedText';
import { TextShimmer } from '../components/TextShimmer';
import { gameInfo, loadGame, type LoadedGame } from '../games/catalog';
import type { GameId, Seat } from '../games/types';
import { linkProps } from '../lib/route';
import { useDocumentTitle } from '../lib/spells';
import type { Table } from '../lib/table';
import { TableView } from './TableView';

type Net = typeof import('../lib/net');

type Phase = { kind: 'loading' } | { kind: 'missing' } | { kind: 'error'; message: string } | { kind: 'ready' };

const PRESENCE_MS = 75_000;

export default function OnlineTable({ code }: { code: string }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  const [seat, setSeat] = useState<Seat | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [loaded, setLoaded] = useState<{ id: GameId; game: LoadedGame } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const net = useRef<Net | null>(null);

  useEffect(() => {
    let stop: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('../lib/net');
        net.current = mod;
        const joined = await mod.joinTable(code);
        if (cancelled) return;
        if (joined.kind === 'missing') {
          setPhase({ kind: 'missing' });
          return;
        }
        setSeat(joined.kind === 'seated' ? joined.seat : null);
        stop = mod.watchTable(
          code,
          (t) => {
            if (!t) setPhase({ kind: 'missing' });
            else {
              setTable(t);
              setPhase({ kind: 'ready' });
            }
          },
          (e) => setPhase({ kind: 'error', message: e.message }),
        );
      } catch (e) {
        if (!cancelled) setPhase({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
      }
    })();
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [code]);

  const game = table?.game;
  useEffect(() => {
    if (!game) return;
    let live = true;
    loadGame(game).then((g) => live && setLoaded({ id: game, game: g }));
    return () => {
      live = false;
    };
  }, [game]);

  // Heartbeat so the other player can see you're still here.
  useEffect(() => {
    if (seat === null || phase.kind !== 'ready') return;
    const beat = () => document.visibilityState === 'visible' && net.current?.heartbeat(code, seat);
    beat();
    const t = setInterval(() => {
      beat();
      setNow(Date.now());
    }, 30_000);
    document.addEventListener('visibilitychange', beat);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', beat);
    };
  }, [code, seat, phase.kind]);

  if (phase.kind === 'missing') return <Notice title="No table here." body={`Nobody has opened a table with the code ${code}.`} />;
  if (phase.kind === 'error')
    return <Notice title="Couldn't reach the table." body="Check your connection and try again. If it keeps happening, the table may be closed." detail={phase.message} />;
  if (!table || !loaded || loaded.id !== table.game) return <Loading />;

  const opponent = seat === null ? null : seat === 0 ? 1 : 0;
  const seen = opponent === null ? undefined : table.seen?.[String(opponent) as '0' | '1'];
  const present = seen === undefined ? undefined : now - seen < PRESENCE_MS;

  return (
    <TableView
      table={table}
      loaded={loaded.game}
      seat={seat}
      mode="online"
      present={present}
      dispatch={(action) => (seat === null || !net.current ? Promise.resolve(false) : net.current.act(code, action, seat))}
      actions={<CopyLink code={code} compact />}
      waiting={seat === 0 ? <Invite code={code} game={table.game} /> : undefined}
    />
  );
}


export function inviteUrl(code: string) {
  return `${location.origin}/t/${code}`;
}

function CopyLink({ code, compact }: { code: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl(code));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked; the link is visible to copy by hand */
    }
  };
  if (compact) {
    return (
      <button type="button" onClick={copy} className="btn-ghost font-mono text-xs tracking-[0.2em]" aria-label="Copy the invite link">
        {code}
        <Icon name={copied ? 'check' : 'copy'} size={14} className={copied ? 'anim-pop text-felt' : ''} />
      </button>
    );
  }
  return (
    <button type="button" onClick={copy} className={`btn-ink min-w-36 ${copied ? 'bg-felt dark:bg-felt-ink dark:text-felt' : ''}`}>
      <Icon name={copied ? 'check' : 'copy'} size={16} className={copied ? 'anim-pop' : ''} />
      {copied ? 'Link copied' : 'Copy link'}
    </button>
  );
}

function Invite({ code, game }: { code: string; game: GameId }) {
  const [face, setFace] = useState({ value: 5, n: 0 });
  const url = inviteUrl(code);
  const canShare = typeof navigator.share === 'function';
  return (
    <section className="anim-rise w-full rounded-[28px] border border-line bg-card p-6 text-center sm:p-8" aria-label="Invite a player">
      <p className="eyebrow">Table code</p>
      <p className="mt-2 font-mono text-[clamp(34px,8vw,52px)] font-medium tracking-[0.28em] text-ink">
        <DecryptedText text={code} animateOn="view" sequential speed={70} characters="ABCDEFGHJKLMNPQRSTUVWXYZ23456789" encryptedClassName="text-mute" />
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-mute">Send this link to whoever you want to play {gameInfo(game).name} with. They'll sit down the moment they open it.</p>
      <p className="mx-auto mt-5 max-w-sm truncate rounded-full border border-line bg-bg px-4 py-2.5 font-mono text-[11px] text-mute select-all">{url}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <CopyLink code={code} />
        {canShare && (
          <button type="button" className="btn-line" onClick={() => navigator.share({ title: 'Parlour', text: `Play ${gameInfo(game).name} with me`, url }).catch(() => {})}>
            <Icon name="share" size={16} /> Share
          </button>
        )}
      </div>
      <div className="mt-8 flex items-center justify-center gap-4 border-t border-line pt-6">
        <span className="orbit mx-3" aria-hidden />
        <TextShimmer className="text-sm">Waiting for someone to sit down…</TextShimmer>
      </div>
      <div className="mt-6 flex items-center justify-center gap-3 text-xs text-mute">
        <button
          type="button"
          onClick={() => setFace((f) => ({ value: 1 + Math.floor(Math.random() * 6), n: f.n + 1 }))}
          className="rounded-2xl transition-transform hover:-rotate-6 active:scale-90"
          aria-label="Roll the die while you wait"
          title="Roll the die while you wait"
        >
          <Die value={face.value} spin={face.n} size={36} />
        </button>
        <span>Fidget die, while you wait.</span>
      </div>
      <p className="mt-6 text-xs text-mute">
        Sitting next to them?{' '}
        <a {...linkProps(`/here/${game}`)} className="underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink">
          Play on this device instead
        </a>
        .
      </p>
    </section>
  );
}

function Loading() {
  useDocumentTitle('Taking a seat — Parlour');
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6">
      <span className="orbit" aria-hidden />
      <TextShimmer className="text-sm">Taking a seat…</TextShimmer>
    </div>
  );
}

export function Notice({ title, body, detail }: { title: string; body: string; detail?: string }) {
  useDocumentTitle(`${title} — Parlour`);
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center px-4 sm:px-6">
        <Logo />
      </header>
      <main className="anim-rise mx-auto flex max-w-md flex-1 flex-col items-start justify-center px-6 pb-24">
        <h1 className="display text-5xl italic">{title}</h1>
        <p className="mt-4 text-mute">{body}</p>
        {detail && <p className="mt-3 font-mono text-[10px] text-mute/70">{detail}</p>}
        <a {...linkProps('/')} className="btn-ink mt-8">
          <Icon name="back" size={16} /> Back to the games
        </a>
      </main>
    </div>
  );
}
