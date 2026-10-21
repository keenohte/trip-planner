'use client';

import { useState } from 'react';
import { IdeaMap } from '@/components/IdeaMap';
import { IdeaModal } from '@/components/IdeaModal';
import { NewBottomNav } from '@/components/NewBottomNav';
import type { Idea } from '@/lib/ideas';

function formatTripDate(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

export function MapBrowser({ ideas, timezone, tripStart, tripEnd, preview = false }: {
  ideas: Idea[];
  timezone: string;
  tripStart: string | null;
  tripEnd: string | null;
  preview?: boolean;
}) {
  const [selected, setSelected] = useState<Idea | null>(null);
  const dateRange = tripStart && tripEnd ? `${formatTripDate(tripStart)} – ${formatTripDate(tripEnd)}` : 'Trip dates';

  return <div className="new-app new-map-page">
    <header className="new-app-header">
      <p className="new-trip-range">{dateRange}{preview && <span className="new-preview-label">Preview</span>}</p>
      <h1>Your trip map</h1>
    </header>
    <div className="new-map-page__content"><IdeaMap ideas={ideas} onOpen={setSelected} showVoting /></div>
    <NewBottomNav active="map" addLabel="Add place" addHref="/ideas/new" />
    {selected && <IdeaModal idea={selected} timezone={timezone} onClose={() => setSelected(null)} />}
  </div>;
}
