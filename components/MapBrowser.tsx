'use client';

import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { TripMap } from '@/components/TripMap';
import { NewBottomNav } from '@/components/NewBottomNav';
import { EventComposer, type PreviewEventInput } from '@/components/calendar/EventComposer';
import type { ScheduleItem } from '@/lib/schedule';

function formatTripDate(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

export function MapBrowser({ items, timezone, tripStart, tripEnd, preview = false }: {
  items: ScheduleItem[];
  timezone: string;
  tripStart: string | null;
  tripEnd: string | null;
  preview?: boolean;
}) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [mapItems, setMapItems] = useState(items);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const stableViewport = useRef({ width: 0, height: 0 });
  useEffect(() => setMapItems(items), [items]);
  useEffect(() => {
    const syncStableViewport = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const previous = stableViewport.current;
      const widthChanged = Math.abs(width - previous.width) > 80;
      const heightRecovered = height >= previous.height - 1;

      // A software keyboard only reduces height. Keep the map at the last full
      // viewport size; accept a new height after rotation or once it recovers.
      if (!previous.height || widthChanged || heightRecovered) {
        stableViewport.current = { width, height };
        setViewportHeight(height);
      }
    };

    syncStableViewport();
    window.addEventListener('resize', syncStableViewport);
    return () => window.removeEventListener('resize', syncStableViewport);
  }, []);
  const dateRange = tripStart && tripEnd ? `${formatTripDate(tripStart)} – ${formatTripDate(tripEnd)}` : 'Trip dates';
  const initialDate = useMemo(() => {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const today = `${values.year}-${values.month}-${values.day}`;
    return tripStart && tripEnd && today >= tripStart && today <= tripEnd ? today : tripStart ?? today;
  }, [timezone, tripStart, tripEnd]);

  const savePreviewEvent = ({ title, startsAt, endsAt, city, notes, mapsUrl, websiteUrl }: PreviewEventInput) => {
    const id = `preview-${Date.now()}`;
    const created: ScheduleItem = {
      id, source: 'activity', title, startsAt, endsAt, type: 'Activity', types: ['Activity'], detail: city || null,
      timezone, imageUrl: null, idea: null, booking: null, href: '/schedule',
      activity: { id, tripId: 'preview', title, country: null, city: city || null, neighborhood: null, startsAt, endsAt, imageUrl: null, externalImageUrl: null, coverPath: null, notes: notes || null, mapsUrl: mapsUrl || null, locationAddress: null, latitude: null, longitude: null, websiteUrl: websiteUrl || null, createdBy: 'preview', createdAt: new Date().toISOString() }, comments: [],
    };
    setMapItems((current) => [...current, created].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)));
  };

  const pageStyle = viewportHeight ? { '--map-page-height': `${viewportHeight}px` } as CSSProperties : undefined;

  return <div className="new-app new-map-page" style={pageStyle}>
    <header className="new-app-header">
      <p className="new-trip-range">{dateRange}{preview && <span className="new-preview-label">Preview</span>}</p>
      <h1>Your trip map</h1>
    </header>
    <div className="new-map-page__content"><TripMap items={mapItems} /></div>
    <NewBottomNav active="map" addLabel="Add schedule item" onAdd={() => setComposerOpen(true)} />
    {composerOpen && <EventComposer key={initialDate} initialStartsAt={`${initialDate}T09:00`} items={mapItems} timezone={timezone} preview={preview} onPreviewSave={savePreviewEvent} onClose={() => setComposerOpen(false)} />}
  </div>;
}
