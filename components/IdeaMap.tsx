'use client';

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps-loader';
import type { Idea } from '@/lib/ideas';

type Plottable = Idea & { latitude: number; longitude: number };

export function hasCoordinates(idea: Idea): idea is Plottable {
  return typeof idea.latitude === 'number' && typeof idea.longitude === 'number';
}

function markerElement(idea: Plottable, liked: boolean) {
  const pin = document.createElement('button');
  pin.type = 'button';
  pin.className = `map-pin${liked ? ' map-pin--liked' : ''}`;
  pin.setAttribute('aria-label', idea.title);
  pin.textContent = idea.title;
  return pin;
}

export function IdeaMap({ ideas, onSelect }: { ideas: Idea[]; onSelect: (idea: Idea) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const plottable = ideas.filter(hasCoordinates);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !container.current) return;
        if (!mapRef.current) {
          mapRef.current = new maps.Map(container.current, {
            center: { lat: 0, lng: 0 },
            zoom: 2,
            mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined,
            disableDefaultUI: true,
            zoomControl: true,
            clickableIcons: false,
            gestureHandling: 'greedy',
          });
        }
        setReady(true);
      })
      .catch((loadError: Error) => {
        if (!cancelled) setError(loadError.message);
      });

    return () => { cancelled = true; };
  }, []);

  /* Markers are rebuilt whenever the filtered set changes, so the map
     always reflects the same ideas the list would show. */
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !window.google?.maps) return;

    markersRef.current.forEach((marker) => { marker.map = null; });
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    plottable.forEach((idea) => {
      const liked = idea.currentVote !== null && idea.currentVote !== 'pass';
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: idea.latitude, lng: idea.longitude },
        content: markerElement(idea, liked),
        title: idea.title,
      });
      marker.addListener('click', () => onSelect(idea));
      markersRef.current.push(marker);
      bounds.extend({ lat: idea.latitude, lng: idea.longitude });
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { top: 56, right: 40, bottom: 40, left: 40 });
      /* fitBounds on a single point zooms to maximum, which is
         disorienting — pull back to a neighbourhood view. */
      if (plottable.length === 1) {
        map.setCenter({ lat: plottable[0].latitude, lng: plottable[0].longitude });
        map.setZoom(15);
      }
    }
  }, [ready, onSelect, plottable]);

  if (error) {
    return (
      <div className="map-frame map-frame--error">
        <p>The map could not load.</p>
        <p className="map-note">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="map-frame" ref={container} role="application" aria-label="Map of ideas" />
      {plottable.length < ideas.length && (
        <p className="map-note">
          {ideas.length - plottable.length} of {ideas.length} not shown — add a Google Maps link to place them.
        </p>
      )}
    </>
  );
}
