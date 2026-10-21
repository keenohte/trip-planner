'use client';

import { IdeaMap } from '@/components/IdeaMap';
import { NewBottomNav } from '@/components/NewBottomNav';
import type { Idea } from '@/lib/ideas';

function formatTripDate(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

export function MapBrowser({ ideas, tripStart, tripEnd, preview = false }: {
  ideas: Idea[];
  tripStart: string | null;
  tripEnd: string | null;
  preview?: boolean;
}) {
  const dateRange = tripStart && tripEnd ? `${formatTripDate(tripStart)} – ${formatTripDate(tripEnd)}` : 'Trip dates';

  return <div className="new-app new-map-page">
    <header className="new-app-header">
      <p className="new-trip-range">{dateRange}{preview && <span className="new-preview-label">Preview</span>}</p>
      <h1>Your trip map</h1>
    </header>
    <div className="new-map-page__content"><IdeaMap ideas={ideas} /></div>
    <NewBottomNav active="map" addLabel="Add place" addHref="/ideas/new" />
  </div>;
}
