import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
window.addEventListener('popstate', notify);

export function navigate(path: string, { replace = false } = {}) {
  if (path === location.pathname + location.search) return;
  history[replace ? 'replaceState' : 'pushState'](null, '', path);
  notify();
  if (!replace) window.scrollTo({ top: 0 });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const usePath = () => useSyncExternalStore(subscribe, () => location.pathname + location.search);

/** Intercept plain left-clicks on internal links. */
export function linkProps(href: string) {
  return {
    href,
    onClick(e: React.MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      navigate(href);
    },
  };
}
