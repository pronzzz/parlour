import { useEffect, useState } from 'react';
import { Icon } from '../components/Icon';
import { loadGame, type LoadedGame } from '../games/catalog';
import type { GameId, Seat } from '../games/types';
import { linkProps } from '../lib/route';
import { freshTable, outcomeOf, reduce, type Action, type Table } from '../lib/table';
import { TableView } from './TableView';

/** Pass-and-play on one device. Same rules and reducer as an online table, no network. */
export default function HereTable({ game }: { game: GameId }) {
  const [table, setTable] = useState<Table | null>(null);
  const [loaded, setLoaded] = useState<{ id: GameId; game: LoadedGame } | null>(null);

  useEffect(() => {
    let live = true;
    loadGame(game).then((g) => {
      if (!live) return;
      setLoaded({ id: game, game: g });
      setTable({ ...freshTable(game, g.rules, 'here-0'), seats: ['here-0', 'here-1'] });
    });
    return () => {
      live = false;
    };
  }, [game]);

  // Follow game switches made from the end-of-round picker.
  useEffect(() => {
    if (!table || loaded?.id === table.game) return;
    let live = true;
    loadGame(table.game).then((g) => live && setLoaded({ id: table.game, game: g }));
    return () => {
      live = false;
    };
  }, [table, loaded?.id]);

  if (!table || !loaded || loaded.id !== table.game) return <div className="min-h-dvh" />;

  const dispatch = async (action: Action) => {
    const out = outcomeOf(table, loaded.game.rules);
    const seat: Seat = out.kind === 'playing' ? out.turn : 0;
    const patch = await reduce(table, action, seat);
    if (!patch) return false;
    setTable((t) => (t ? { ...t, ...patch } : t));
    return true;
  };

  return (
    <TableView
      table={table}
      loaded={loaded.game}
      seat={null}
      mode="here"
      dispatch={dispatch}
      actions={
        <a {...linkProps('/#games')} className="btn-ghost text-xs" title="Play over a link instead">
          <Icon name="phone" size={15} />
          <span className="hidden sm:inline">Same device</span>
        </a>
      }
    />
  );
}
