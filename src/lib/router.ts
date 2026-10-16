import { useEffect, useState } from 'react';

/** Hash routes keep deep links working on static hosts like GitHub Pages. */
export type Route =
  | { name: 'home' }
  | { name: 'paper'; paperId: string }
  | { name: 'exam'; attemptId: string }
  | { name: 'results'; attemptId: string };

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (parts[0] === 'paper' && parts[1]) return { name: 'paper', paperId: parts[1] };
  if (parts[0] === 'exam' && parts[1]) return { name: 'exam', attemptId: parts[1] };
  if (parts[0] === 'results' && parts[1]) return { name: 'results', attemptId: parts[1] };
  return { name: 'home' };
}

export function href(route: Route): string {
  switch (route.name) {
    case 'home':
      return '#/';
    case 'paper':
      return `#/paper/${encodeURIComponent(route.paperId)}`;
    case 'exam':
      return `#/exam/${encodeURIComponent(route.attemptId)}`;
    case 'results':
      return `#/results/${encodeURIComponent(route.attemptId)}`;
  }
}

export function navigate(route: Route, replace = false) {
  if (replace) location.replace(href(route));
  else location.hash = href(route);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseRoute(location.hash));
      window.scrollTo(0, 0);
    };
    addEventListener('hashchange', onChange);
    return () => removeEventListener('hashchange', onChange);
  }, []);
  return route;
}
