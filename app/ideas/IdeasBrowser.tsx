'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { IdeaModal } from '@/components/IdeaModal';
import { PersistedIdeaCard } from '@/components/PersistedIdeaCard';
import { NewIdeaTrigger } from '@/components/NewIdeaTrigger';
import { useCloseDetailsOnOutside } from '@/lib/use-close-details';
import type { Idea } from '@/lib/ideas';

export function IdeasBrowser({ ideas, timezone, variant = 'ideas' }: { ideas: Idea[]; timezone: string; variant?: 'ideas' | 'confirmed' }) {
  const [city, setCity] = useState('all');
  const [type, setType] = useState('all');
  const [addedBy, setAddedBy] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Idea | null>(null);
  const filterRef = useRef<HTMLDetailsElement>(null);
  useCloseDetailsOnOutside(filterRef);
  const closeModal = useCallback(() => setSelected(null), []);

  useEffect(() => {
    setSelected((current) => current ? ideas.find((idea) => idea.id === current.id) ?? null : null);
  }, [ideas]);

  const cities = useMemo(() => [...new Set(ideas.map((idea) => idea.city).filter((value): value is string => Boolean(value)))].sort(), [ideas]);
  const types = useMemo(() => [...new Set(ideas.flatMap((idea) => idea.types))].sort(), [ideas]);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = ideas.filter((idea) => {
    const matchesQuery = !normalizedQuery || [idea.title, idea.city, idea.country, idea.neighborhood, ...idea.types].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
    return matchesQuery && (city === 'all' || idea.city === city) && (type === 'all' || idea.types.includes(type)) && (addedBy === 'all' || (addedBy === 'me' ? idea.addedByMe : !idea.addedByMe));
  });
  const hasFilters = city !== 'all' || type !== 'all' || addedBy !== 'all';
  const clearFilters = () => { setCity('all'); setType('all'); setAddedBy('all'); };

  return <>
    <div className="ideas-page-toolbar">
      <div><h2>{variant === 'confirmed' ? 'Confirmed' : 'Ideas'}</h2><p>{variant === 'confirmed' ? 'The places and activities you both like.' : 'Things to consider, vote to lock in your pick.'}</p></div>
      <div className="ideas-toolbar-actions">
        <details ref={filterRef} className={`filter-menu${hasFilters ? ' has-filters' : ''}`}>
          <summary aria-label="Filter ideas"><SlidersHorizontal size={18} aria-hidden="true" /></summary>
          <div className="filter-popover">
            <div className="filter-popover-title"><strong>Filters</strong>{hasFilters && <button type="button" onClick={clearFilters}>Clear all</button>}</div>
            <label>City<select value={city} onChange={(event) => setCity(event.target.value)}><option value="all">All cities</option>{cities.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
            <label>Type<select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option>{types.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
            <label>Added by<select value={addedBy} onChange={(event) => setAddedBy(event.target.value)}><option value="all">Either traveler</option><option value="me">Me</option><option value="partner">Partner</option></select></label>
            <div className="filter-results">Showing {filtered.length} of {ideas.length}</div>
          </div>
        </details>
        <label className="idea-search"><Search size={17} aria-hidden="true" /><span className="sr-only">Search ideas</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search…" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X size={14} aria-hidden="true" /></button>}</label>
        {variant === 'ideas' && <NewIdeaTrigger className="new-idea-button" timezone={timezone}><Plus size={18} aria-hidden="true" />New</NewIdeaTrigger>}
      </div>
    </div>
    {filtered.length > 0 ? <div className="ideas-grid">{filtered.map((idea) => <PersistedIdeaCard key={idea.id} idea={idea} onOpen={setSelected} />)}</div> : <section className="empty-state compact-empty"><h3>{query || hasFilters ? 'No matching ideas' : variant === 'confirmed' ? 'No confirmed ideas yet' : 'Nothing saved yet'}</h3><p>{query || hasFilters ? 'Try a broader search or clear your filters.' : variant === 'confirmed' ? 'An idea appears here when both travelers like it.' : 'Start with the place you are most excited about.'}</p>{hasFilters && <button className="secondary-button" type="button" onClick={clearFilters}>Clear filters</button>}</section>}
    {selected && <IdeaModal idea={selected} timezone={timezone} onClose={closeModal} />}
  </>;
}
