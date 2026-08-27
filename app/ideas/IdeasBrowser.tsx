'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LayoutGrid, Map as MapIcon, Plus, SlidersHorizontal, X } from 'lucide-react';
import { IdeaModal } from '@/components/IdeaModal';
import { IdeaMap } from '@/components/IdeaMap';
import { PersistedIdeaCard } from '@/components/PersistedIdeaCard';
import { NewIdeaTrigger } from '@/components/NewIdeaTrigger';
import { Button } from '@/components/ui/Button';
import { SearchInput, Select } from '@/components/ui/FormControls';
import { useCloseDetailsOnOutside } from '@/lib/use-close-details';
import { categoryMeta, formatTag, ideaCategories } from '@/lib/categories';
import type { Idea } from '@/lib/ideas';

const copy = {
  ideas: {
    title: 'Ideas',
    subtitle: 'Things to consider. Like one to lock in your pick.',
    emptyTitle: 'Nothing saved yet',
    emptyBody: 'Start with the place you are most excited about.',
  },
  confirmed: {
    title: 'Confirmed',
    subtitle: 'The places you both like.',
    emptyTitle: 'No confirmed ideas yet',
    emptyBody: 'An idea lands here when you both like it.',
  },
} as const;

export function IdeasBrowser({ ideas, timezone, variant = 'ideas' }: { ideas: Idea[]; timezone: string; variant?: 'ideas' | 'confirmed' }) {
  const [city, setCity] = useState('all');
  const [category, setCategory] = useState('all');
  const [tag, setTag] = useState('all');
  const [addedBy, setAddedBy] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Idea | null>(null);
  const [view, setView] = useState<'list' | 'map'>('list');
  const filterRef = useRef<HTMLDetailsElement>(null);
  useCloseDetailsOnOutside(filterRef);
  const closeModal = useCallback(() => setSelected(null), []);
  const text = copy[variant];

  useEffect(() => {
    setSelected((current) => (current ? ideas.find((idea) => idea.id === current.id) ?? null : null));
  }, [ideas]);

  const cities = useMemo(
    () => [...new Set(ideas.map((idea) => idea.city).filter((value): value is string => Boolean(value)))].sort(),
    [ideas],
  );
  /* Tags are scoped to the selected category: pick Food and the tag list
     narrows to sushi, noodles, izakaya. That gives the drill-down without
     maintaining a subcategory tree. */
  const tags = useMemo(() => {
    const pool = category === 'all' ? ideas : ideas.filter((idea) => idea.category === category);
    return [...new Set(pool.flatMap((idea) => idea.tags))].sort();
  }, [ideas, category]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = ideas.filter((idea) => {
    const haystack = [idea.title, idea.city, idea.country, idea.neighborhood, categoryMeta[idea.category].label, ...idea.tags].filter(Boolean).join(' ').toLowerCase();
    const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
    return (
      matchesQuery &&
      (city === 'all' || idea.city === city) &&
      (category === 'all' || idea.category === category) &&
      (tag === 'all' || idea.tags.includes(tag)) &&
      (addedBy === 'all' || (addedBy === 'me' ? idea.addedByMe : !idea.addedByMe))
    );
  });

  const hasFilters = city !== 'all' || category !== 'all' || tag !== 'all' || addedBy !== 'all';
  const clearFilters = () => {
    setCity('all');
    setCategory('all');
    setTag('all');
    setAddedBy('all');
  };
  const isNarrowed = Boolean(query) || hasFilters;

  return (
    <>
      <div className="toolbar">
        <div>
          <h2 className="toolbar__title">{text.title}</h2>
          <p className="toolbar__subtitle">{text.subtitle}</p>
        </div>

        <div className="toolbar__actions">
          {/* Always rendered. Hiding the toggle when nothing was mappable
              made an empty dataset indistinguishable from a broken or
              undeployed feature — the map explains its own emptiness now. */}
          <div className="view-toggle" role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
              <LayoutGrid size={16} aria-hidden="true" />
              <span className="sr-only">List view</span>
            </button>
            <button type="button" aria-pressed={view === 'map'} onClick={() => setView('map')}>
              <MapIcon size={16} aria-hidden="true" />
              <span className="sr-only">Map view</span>
            </button>
          </div>
          <details ref={filterRef} className={`filter${hasFilters ? ' filter--active' : ''}`}>
            <summary aria-label="Filter ideas">
              <SlidersHorizontal size={18} aria-hidden="true" />
            </summary>
            <div className="filter__popover">
              {hasFilters && (
                <div className="filter__header">
                  <button className="filter__clear" type="button" onClick={clearFilters}>
                    Clear all
                  </button>
                </div>
              )}
              <label>
                City
                <Select value={city} onChange={(event) => setCity(event.target.value)}>
                  <option value="all">All cities</option>
                  {cities.map((value) => (
                    <option value={value} key={value}>{value}</option>
                  ))}
                </Select>
              </label>
              <label>
                Category
                <Select value={category} onChange={(event) => { setCategory(event.target.value); setTag('all'); }}>
                  <option value="all">All categories</option>
                  {ideaCategories.map((value) => (
                    <option value={value} key={value}>{categoryMeta[value].label}</option>
                  ))}
                </Select>
              </label>
              {tags.length > 0 && (
                <label>
                  Tag
                  <Select value={tag} onChange={(event) => setTag(event.target.value)}>
                    <option value="all">All tags</option>
                    {tags.map((value) => (
                      <option value={value} key={value}>{formatTag(value)}</option>
                    ))}
                  </Select>
                </label>
              )}
              <label>
                Added by
                <Select value={addedBy} onChange={(event) => setAddedBy(event.target.value)}>
                  <option value="all">Either traveler</option>
                  <option value="me">Me</option>
                  <option value="partner">Partner</option>
                </Select>
              </label>
            </div>
          </details>

          <div className="search">
            <SearchInput aria-label="Search ideas" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search…" />
            {query && (
              <button className="search__clear" type="button" onClick={() => setQuery('')} aria-label="Clear search">
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          {variant === 'ideas' && (
            <NewIdeaTrigger timezone={timezone}>
              <Plus size={18} aria-hidden="true" />
              New
            </NewIdeaTrigger>
          )}
        </div>
      </div>

      {filtered.length > 0 && view === 'map' ? (
        <IdeaMap ideas={filtered} onOpen={setSelected} showVoting={variant === 'ideas'} />
      ) : filtered.length > 0 ? (
        <div className="card-grid">
          {filtered.map((idea) => (
            <PersistedIdeaCard key={idea.id} idea={idea} onOpen={setSelected} />
          ))}
        </div>
      ) : (
        <section className="empty-state">
          <h3>{isNarrowed ? 'No matching ideas' : text.emptyTitle}</h3>
          <p>{isNarrowed ? 'Try a broader search or clear your filters.' : text.emptyBody}</p>
          {hasFilters && (
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </section>
      )}

      {selected && <IdeaModal idea={selected} timezone={timezone} onClose={closeModal} />}
    </>
  );
}
