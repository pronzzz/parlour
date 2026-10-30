import { lazy, Suspense, useEffect } from 'react';
import { isGameId } from './games/catalog';
import { navigate, usePath } from './lib/route';
import Landing from './pages/Landing';

const OnlineTable = lazy(() => import('./pages/OnlineTable'));
const HereTable = lazy(() => import('./pages/HereTable'));
const Notice = lazy(() => import('./pages/OnlineTable').then((m) => ({ default: m.Notice })));

const CODE = /^\/t\/([A-HJ-NP-Z2-9]{5})\/?$/i;
const HERE = /^\/here\/([a-z]+)\/?$/;

export default function App() {
  const full = usePath();
  const [path, query = ''] = full.split('?');
  const legacy = new URLSearchParams(query).has('room');

  // Lower-case codes from hand-typed links still work.
  const code = CODE.exec(path)?.[1];
  useEffect(() => {
    if (code && code !== code.toUpperCase()) navigate(`/t/${code.toUpperCase()}`, { replace: true });
  }, [code]);

  const here = HERE.exec(path)?.[1];

  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      {code ? (
        <OnlineTable key={code} code={code.toUpperCase()} />
      ) : here && isGameId(here) ? (
        <HereTable key={here} game={here} />
      ) : path === '/' || path === '' ? (
        <Landing legacy={legacy} />
      ) : (
        <Notice title="Wrong table." body="There's nothing at this address. Table links look like /t/ABC23." />
      )}
    </Suspense>
  );
}
