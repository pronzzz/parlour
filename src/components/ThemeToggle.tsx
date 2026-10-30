import { useState } from 'react';
import { Icon } from './Icon';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme as Theme) ?? 'light');
  const flip = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.dataset.theme = next;
      setTheme(next);
    };
    // A soft cross-fade where the browser supports view transitions.
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void };
    if (doc.startViewTransition && !matchMedia('(prefers-reduced-motion: reduce)').matches) doc.startViewTransition(apply);
    else apply();
    try {
      localStorage.setItem('parlour:theme', next);
    } catch {
      /* private mode */
    }
  };
  return (
    <button type="button" onClick={flip} className="btn-ghost w-9 px-0" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
    </button>
  );
}
