'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Globe2, MapPin, MapPinned } from 'lucide-react';
import { loadGoogleMaps, type MapsApi } from '@/lib/google-maps-loader';
import type { ScheduleItem } from '@/lib/schedule';

type PlaceData = {
  mapsUrl: string | null;
  websiteUrl: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
};

type PlottableItem = ScheduleItem & { place: PlaceData & { latitude: number; longitude: number } };

function placeData(item: ScheduleItem): PlaceData {
  const source = item.activity ?? item.idea ?? item.booking;
  return {
    mapsUrl: source?.mapsUrl ?? null,
    websiteUrl: source?.websiteUrl ?? null,
    address: source?.locationAddress ?? item.detail ?? null,
    latitude: source?.latitude ?? null,
    longitude: source?.longitude ?? null,
  };
}

function isPlottable(item: ScheduleItem): item is PlottableItem {
  const place = placeData(item);
  return typeof place.latitude === 'number' && typeof place.longitude === 'number';
}

function withPlace(item: ScheduleItem): PlottableItem {
  return { ...item, place: placeData(item) as PlottableItem['place'] };
}

function formatWhen(item: ScheduleItem) {
  const date = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: item.timezone }).format(new Date(item.startsAt));
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: item.timezone }).format(new Date(item.startsAt));
  return `${date} · ${time}`;
}

function mapsHref(item: PlottableItem) {
  return item.place.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${item.place.latitude},${item.place.longitude}`;
}

const pinSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

export function TripMap({ items }: { items: ScheduleItem[] }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const apiRef = useRef<MapsApi | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const markerElementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const plottable = useMemo(() => items.filter(isPlottable).map(withPlace), [items]);
  const boundsKey = useMemo(() => plottable.map((item) => `${item.source}-${item.id}`).sort().join(','), [plottable]);
  const selected = plottable.find((item) => `${item.source}-${item.id}` === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((api) => {
        if (cancelled || !container.current || mapRef.current) return;
        apiRef.current = api;
        const map = new api.Map(container.current, {
          center: { lat: 0, lng: 0 }, zoom: 2,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined,
          disableDefaultUI: true, zoomControl: false, clickableIcons: false, gestureHandling: 'greedy',
        });
        map.addListener('click', () => setSelectedId(null));
        mapRef.current = map;
        setReady(true);
      })
      .catch((loadError: Error) => { if (!cancelled) setError(loadError.message); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const api = apiRef.current;
    if (!ready || !map || !api) return;
    markersRef.current.forEach((marker) => { marker.map = null; });
    markersRef.current.clear();
    markerElementsRef.current.clear();

    plottable.forEach((item) => {
      const key = `${item.source}-${item.id}`;
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'map-pin map-pin--interactive';
      pin.setAttribute('aria-label', `Show ${item.title}`);

      const icon = document.createElement('span');
      icon.className = 'map-pin__category';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = pinSvg;
      const label = document.createElement('span');
      label.className = 'map-pin__label';
      label.textContent = item.title;
      pin.append(icon, label);
      pin.addEventListener('click', (event) => { event.stopPropagation(); setSelectedId(key); });

      const marker = new api.AdvancedMarkerElement({
        map,
        position: { lat: item.place.latitude, lng: item.place.longitude },
        content: pin,
        title: item.title,
        collisionBehavior: 'OPTIONAL_AND_HIDES_LOWER_PRIORITY',
        zIndex: 1,
      });
      markersRef.current.set(key, marker);
      markerElementsRef.current.set(key, pin);
    });
  }, [ready, plottable]);

  useEffect(() => {
    markersRef.current.forEach((marker, key) => {
      const pin = markerElementsRef.current.get(key);
      pin?.classList.toggle('is-selected', key === selectedId);
      marker.zIndex = key === selectedId ? 10 : 1;
    });
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    const api = apiRef.current;
    if (!ready || !map || !api || plottable.length === 0) return;
    if (plottable.length === 1) {
      map.setCenter({ lat: plottable[0].place.latitude, lng: plottable[0].place.longitude });
      map.setZoom(15);
      return;
    }
    const bounds = new api.LatLngBounds();
    plottable.forEach((item) => bounds.extend({ lat: item.place.latitude, lng: item.place.longitude }));
    map.fitBounds(bounds, { top: 56, right: 40, bottom: 80, left: 40 });
  }, [ready, boundsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <div className="map-frame map-frame--message"><p><strong>The map could not load.</strong></p><p className="map-note">{error}</p></div>;
  if (plottable.length === 0) return <div className="map-frame map-frame--message"><MapPinned size={26} strokeWidth={1.5} aria-hidden="true" /><p><strong>Nothing scheduled on the map yet</strong></p><p className="map-note">Add a Google Maps link to a scheduled event to place it here.</p></div>;

  return <div className="map-shell new-trip-map" data-has-selection={selected ? 'true' : 'false'}>
    <div className="map-frame" ref={container} role="application" aria-label="Map of scheduled locations" />
    {selected && <article className="map-place-card" aria-live="polite">
      <div className="map-place-card__copy">
        <strong>{selected.title}</strong>
        <span>{formatWhen(selected)}</span>
        {selected.place.address && <span>{selected.place.address}</span>}
      </div>
      <div className="map-place-card__actions">
        <a href={mapsHref(selected)} target="_blank" rel="noreferrer" aria-label={`Open ${selected.title} in Google Maps`}><MapPin size={20} aria-hidden="true" /></a>
        {selected.place.websiteUrl && <a href={selected.place.websiteUrl} target="_blank" rel="noreferrer" aria-label={`Open ${selected.title} website`}><Globe2 size={20} aria-hidden="true" /></a>}
      </div>
    </article>}
  </div>;
}
