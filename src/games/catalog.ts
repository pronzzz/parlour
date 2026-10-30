import type { ComponentType } from 'react';
import type { BoardProps, GameId, Rules, Seat } from './types';

export interface GameInfo {
  id: GameId;
  name: string;
  /** One line for the index. */
  line: string;
  minutes: string;
  rules: string[];
  /** Labels for seat 0 / seat 1 in this round, given who started. */
  sides(starter: Seat): [string, string];
}

const bySide = (first: string, second: string) => (starter: Seat): [string, string] =>
  starter === 0 ? [first, second] : [second, first];

export const GAMES: GameInfo[] = [
  {
    id: 'noughts',
    name: 'Noughts & Crosses',
    line: 'Three in a line. Over before the kettle boils.',
    minutes: '1 min',
    rules: ['Crosses go first.', 'Get three in a row, column or diagonal.', 'A full board with no line is a draw.'],
    sides: bySide('Crosses', 'Noughts'),
  },
  {
    id: 'four',
    name: 'Four in a Row',
    line: 'Drop discs, stack them, line up four.',
    minutes: '5 min',
    rules: ['Pick a column — the disc falls to the lowest gap.', 'Four in a line wins: across, down or diagonal.'],
    sides: bySide('First', 'Second'),
  },
  {
    id: 'dots',
    name: 'Dots & Boxes',
    line: 'Draw lines, close boxes, keep your turn.',
    minutes: '6 min',
    rules: ['Draw one line between two dots.', 'Close a box and it is yours — and you go again.', 'Most boxes wins.'],
    sides: bySide('First', 'Second'),
  },
  {
    id: 'reversi',
    name: 'Reversi',
    line: 'Outflank, flip, and own the board.',
    minutes: '10 min',
    rules: [
      'Place a disc so it traps a line of the other colour between two of yours.',
      'Every trapped disc flips.',
      'No legal move? Your turn passes. Most discs at the end wins.',
    ],
    sides: bySide('Dark', 'Light'),
  },
  {
    id: 'chess',
    name: 'Chess',
    line: 'The real thing — castling, en passant, checkmate.',
    minutes: '20 min',
    rules: ['Full rules, checked for you.', 'Pawns promote to a queen.', 'Draws by stalemate, repetition and the 50-move rule.'],
    sides: bySide('White', 'Black'),
  },
  {
    id: 'snakes',
    name: 'Snakes & Ladders',
    line: 'Pure luck, a hundred squares, eight snakes.',
    minutes: '8 min',
    rules: ['Roll and move. Ladders lift you, snakes drop you.', 'A six rolls again.', 'Land exactly on 100 to win.'],
    sides: bySide('First', 'Second'),
  },
];

export const GAME_IDS = GAMES.map((g) => g.id);
export const gameInfo = (id: GameId) => GAMES.find((g) => g.id === id)!;
export const isGameId = (id: unknown): id is GameId => GAME_IDS.includes(id as GameId);

export interface LoadedGame {
  rules: Rules<any, any>;
  Board: ComponentType<BoardProps<any, any>>;
}

const loaders: Record<GameId, () => Promise<LoadedGame>> = {
  noughts: () => import('./boards/Noughts').then((m) => m.default),
  four: () => import('./boards/Four').then((m) => m.default),
  dots: () => import('./boards/Dots').then((m) => m.default),
  reversi: () => import('./boards/Reversi').then((m) => m.default),
  chess: () => import('./boards/Chess').then((m) => m.default),
  snakes: () => import('./boards/Snakes').then((m) => m.default),
};

const loaded = new Map<GameId, Promise<LoadedGame>>();
export function loadGame(id: GameId): Promise<LoadedGame> {
  let p = loaded.get(id);
  if (!p) {
    p = loaders[id]();
    loaded.set(id, p);
  }
  return p;
}
