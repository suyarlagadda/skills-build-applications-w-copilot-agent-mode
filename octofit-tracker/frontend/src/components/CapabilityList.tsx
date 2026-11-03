import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  responseKey: string;
  emptyText: string;
  renderItem: (item: T, index: number) => ReactNode;
};

type ListState<T> =
  | { status: 'loading' }
  | { status: 'success'; items: T[] }
  | { status: 'error' };

export function CapabilityList<T>({ title, description, path, responseKey, emptyText, renderItem }: Props<T>) {
  const [state, setState] = useState<ListState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    async function load() {
      try {
        const response = await getJson<Record<string, T[]>>(path);
        const items = response[responseKey];
        if (!Array.isArray(items)) throw new Error('Invalid list response');
        if (active) setState({ status: 'success', items });
      } catch {
        if (active) setState({ status: 'error' });
      }
    }
    void load();
    return () => { active = false; };
  }, [path, responseKey]);

  return (
    <CapabilityCard title={title} description={description}>
      {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
      {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}. Please try again later.</p>}
      {state.status === 'success' && (
        state.items.length === 0
          ? <p>{emptyText}</p>
          : <ul className="list-group">{state.items.map(renderItem)}</ul>
      )}
    </CapabilityCard>
  );
}
