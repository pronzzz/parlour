import { useEffect, useRef } from 'react';

/**
 * Small touches borrowed from designspells.com-style details: when it's your
 * move and the tab is in the background, the tab title and favicon say so,
 * and phones give a short buzz.
 */
export function useTurnSignal(myTurn: boolean, label = 'Your move') {
  const was = useRef(myTurn);
  useEffect(() => {
    const base = document.title;
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
    const baseIcon = icon?.href;

    const paint = () => {
      const show = myTurn && document.hidden;
      document.title = show ? `● ${label} — Parlour` : base;
      if (icon && baseIcon) icon.href = show ? '/favicon-turn.svg' : baseIcon;
    };
    paint();
    if (myTurn && !was.current) navigator.vibrate?.(14);
    was.current = myTurn;

    document.addEventListener('visibilitychange', paint);
    return () => {
      document.removeEventListener('visibilitychange', paint);
      document.title = base;
      if (icon && baseIcon) icon.href = baseIcon;
    };
  }, [myTurn, label]);
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const before = document.title;
    document.title = title;
    return () => {
      document.title = before;
    };
  }, [title]);
}
