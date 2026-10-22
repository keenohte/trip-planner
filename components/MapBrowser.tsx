'use client';

import { TripMap } from '@/components/TripMap';
import { NewBottomNav } from '@/components/NewBottomNav';
import type { ScheduleItem } from '@/lib/schedule';

function formatTripDate(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

export function MapBrowser({ items, tripStart, tripEnd, preview = false }: {
  items: ScheduleItem[];
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
    <div className="new-map-page__content"><TripMap items={items} /></div>
    <NewBottomNav active="map" addLabel="Add place" addHref="/ideas/new" />
  </div>;
}
