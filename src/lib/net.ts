/**
 * Everything that talks to Firebase. Imported dynamically, so the landing page
 * never downloads the SDK.
 */
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import {
  Timestamp, doc, getDoc, getFirestore, onSnapshot, runTransaction, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { loadGame } from '../games/catalog';
import type { GameId, Seat } from '../games/types';
import { freshTable, reduce, type Action, type Table } from './table';

// Web config is public by design; access is controlled by firestore.rules.
const app = initializeApp({
  apiKey: 'AIzaSyDVAgo4XeGExu19OmdCBmtCsXNJyPdPcTs',
  authDomain: 'global-arcade-app.firebaseapp.com',
  projectId: 'global-arcade-app',
  storageBucket: 'global-arcade-app.firebasestorage.app',
  messagingSenderId: '317082805440',
  appId: '1:317082805440:web:c434ce17117586bf06f925',
});
const auth = getAuth(app);
const db = getFirestore(app);

/** Unambiguous alphabet: no I, O, 0 or 1. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_RE = /^[A-HJ-NP-Z2-9]{5}$/;
const newCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => ALPHABET[b % ALPHABET.length]).join('');

const ref = (code: string) => doc(db, 'tables', code);
/** `expireAt` lets a Firestore TTL policy clear idle tables (TTL needs the Blaze plan to switch on). */
const stamp = () => ({ updatedAt: serverTimestamp(), expireAt: Timestamp.fromMillis(Date.now() + 7 * 864e5) });

let userPromise: Promise<User> | null = null;
export function me(): Promise<User> {
  userPromise ??= new Promise<User>((resolve, reject) => {
    const stop = onAuthStateChanged(auth, (user) => {
      if (user) {
        stop();
        resolve(user);
      }
    });
    signInAnonymously(auth).catch((err) => {
      stop();
      userPromise = null;
      reject(err);
    });
  });
  return userPromise;
}

export async function createTable(game: GameId): Promise<string> {
  const [user, { rules }] = await Promise.all([me(), loadGame(game)]);
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = newCode();
    const created = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref(code));
      if (snap.exists()) return false;
      tx.set(ref(code), { ...freshTable(game, rules, user.uid), createdAt: serverTimestamp(), ...stamp() });
      return true;
    });
    if (created) return code;
  }
  throw new Error('Could not find a free table code');
}

export type Joined = { kind: 'seated'; seat: Seat } | { kind: 'watching' } | { kind: 'missing' };

/** Take a seat at `code` if one is free; otherwise watch. */
export async function joinTable(code: string): Promise<Joined> {
  const user = await me();
  try {
    return await takeSeat(code, user.uid);
  } catch {
    // Someone else (or this same tab, twice) raced us for the seat: settle from a fresh read.
    const snap = await getDoc(ref(code));
    if (!snap.exists()) return { kind: 'missing' };
    const mine = (snap.data() as Table).seats.indexOf(user.uid);
    return mine === 0 || mine === 1 ? { kind: 'seated', seat: mine } : { kind: 'watching' };
  }
}

function takeSeat(code: string, uid: string): Promise<Joined> {
  return runTransaction(db, async (tx): Promise<Joined> => {
    const snap = await tx.get(ref(code));
    if (!snap.exists()) return { kind: 'missing' };
    const table = snap.data() as Table;
    const mine = table.seats.indexOf(uid);
    if (mine === 0 || mine === 1) return { kind: 'seated', seat: mine };
    if (table.seats[1] === null) {
      tx.update(ref(code), { seats: [table.seats[0], uid], updatedAt: serverTimestamp() });
      return { kind: 'seated', seat: 1 };
    }
    return { kind: 'watching' };
  });
}

export function watchTable(code: string, onTable: (t: Table | null) => void, onError: (e: Error) => void) {
  return onSnapshot(ref(code), (snap) => onTable(snap.exists() ? (snap.data() as Table) : null), onError);
}

/** Apply an action inside a transaction so two quick moves can't both land. */
export async function act(code: string, action: Action, seat: Seat): Promise<boolean> {
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref(code));
    if (!snap.exists()) return false;
    const patch = await reduce(snap.data() as Table, action, seat);
    if (!patch) return false;
    tx.update(ref(code), { ...patch, ...stamp() });
    return true;
  });
}

/** Lets the other player see you're still at the table. */
export function heartbeat(code: string, seat: Seat) {
  return updateDoc(ref(code), { [`seen.${seat}`]: Date.now() }).catch(() => {});
}
