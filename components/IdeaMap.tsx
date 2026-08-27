'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImageIcon, MapPin, MapPinned, X } from 'lucide-react';
import { loadGoogleMaps, type MapsApi } from '@/lib/google-maps-loader';
import { distanceKm, formatDistance } from '@/lib/distance';
import { CategoryTagList } from '@/components/ui/Card';
import { VoteControls } from '@/components/VoteControls';
import type { Idea } from '@/lib/ideas';
import type { IdeaCategory } from '@/lib/categories';

/* Lucide paths matching categoryMeta. Duplicated here because marker
   content is built as DOM and cannot render a React component. */
const categoryPinPath: Record<IdeaCategory, string> = {
  food: '<path d="M16 2v20"/><path d="M2 2v7a4 4 0 0 0 8 0V2"/><path d="M6 2v7"/>',
  drink: '<path d="M8 22h8"/><path d="M12 11v11"/><path d="m19 3-7 8-7-8Z"/>',
  shopping: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  sight: '<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="m2 9 10-6 10 6Z"/>',
  activity: '<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
};

type Plottable = Idea & { latitude: number; longitude: number };

export function hasCoordinates(idea: Idea): idea is Plottable {
  return typeof idea.latitude === 'number' && typeof idea.longitude === 'number';
}

const isLiked = (idea: Idea) => idea.currentVote !== null && idea.currentVote !== 'pass';

export function IdeaMap({
  ideas,
  onOpen,
  showVoting = true,
}: {
  ideas: Idea[];
  onOpen: (idea: Idea) => void;
  /* Off on Confirmed: every idea there is already a mutual yes, so a
     heart on every pin says nothing and a vote control invites undoing
     a decision from a page about decisions already made. */
  showVoting?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const apiRef = useRef<MapsApi | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  /* Referential stability matters here. Previously this was recomputed
     inline every render, so selecting an idea produced a new array,
     re-ran the marker effect, and called fitBounds again — which is why
     the map snapped back to the full extent on every click. */
  const plottable = useMemo(() => ideas.filter(hasCoordinates), [ideas]);

  /* fitBounds should fire when the *set* of ideas changes, not when a
     selection changes. Keying on ids gives us that. */
  const boundsKey = useMemo(() => plottable.map((idea) => idea.id).sort().join(','), [plottable]);

  const preview = plottable.find((idea) => idea.id === previewId) ?? null;

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((api) => {
        if (cancelled || !container.current || mapRef.current) return;
        apiRef.current = api;
        mapRef.current = new api.Map(container.current, {
          center: { lat: 0, lng: 0 },
          zoom: 2,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || undefined,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
        });
        mapRef.current.addListener('click', () => setPreviewId(null));
        setReady(true);
      })
      .catch((loadError: Error) => { if (!cancelled) setError(loadError.message); });
    return () => { cancelled = true; };
  }, []);

  // Build markers only when the plotted set actually changes.
  useEffect(() => {
    const map = mapRef.current;
    const api = apiRef.current;
    if (!ready || !map || !api) return;

    markersRef.current.forEach((marker) => { marker.map = null; });
    markersRef.current.clear();
    elementsRef.current.clear();

    plottable.forEach((idea) => {
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'map-pin';
      pin.setAttribute('aria-label', idea.title);
      /* Text is set here, at creation. It was previously left empty and
         populated by the selection effect, which does not depend on
         `ready` — so markers built after load never got their labels. */
      /* Category icon on the pin: a fork says "restaurant" faster than
         reading the name. Rendered as an inline path because these pins
         are DOM, not JSX — same icons as categoryMeta. */
      const mark = document.createElement('span');
      mark.className = 'map-pin__category';
      mark.setAttribute('aria-hidden', 'true');
      mark.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">${categoryPinPath[idea.category]}</svg>`;

      const label = document.createElement('span');
      label.className = 'map-pin__label';
      label.textContent = idea.title;
      const heart = document.createElement('span');
      heart.className = 'map-pin__heart';
      heart.setAttribute('aria-hidden', 'true');
      /* Inline SVG: these pins are built as DOM, not JSX, so the lucide
         React component is not available here. Same path as lucide's
         heart so the icon matches the rest of the app. */
      heart.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>';

      const distance = document.createElement('span');
      distance.className = 'map-pin__distance';
      pin.append(mark, label, heart, distance);
      if (showVoting && isLiked(idea)) pin.classList.add('map-pin--liked');
      pin.addEventListener('click', (event) => {
        event.stopPropagation();
        setPreviewId((current) => (current === idea.id ? null : idea.id));
      });

      const marker = new api.AdvancedMarkerElement({
        map,
        position: { lat: idea.latitude, lng: idea.longitude },
        content: pin,
        title: idea.title,
        collisionBehavior: 'OPTIONAL_AND_HIDES_LOWER_PRIORITY',
        zIndex: 1,
      });
      markersRef.current.set(idea.id, marker);
      elementsRef.current.set(idea.id, pin);
    });
  }, [ready, plottable, showVoting]);

  // Fit only when the set changes — never on selection.
  useEffect(() => {
    const map = mapRef.current;
    const api = apiRef.current;
    if (!ready || !map || !api || plottable.length === 0) return;
    if (plottable.length === 1) {
      map.setCenter({ lat: plottable[0].latitude, lng: plottable[0].longitude });
      map.setZoom(15);
      return;
    }
    const bounds = new api.LatLngBounds();
    plottable.forEach((idea) => bounds.extend({ lat: idea.latitude, lng: idea.longitude }));
    map.fitBounds(bounds, { top: 56, right: 40, bottom: 40, left: 40 });
  }, [ready, boundsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Selection updates mutate the existing pins rather than rebuilding
     them — no marker churn, no map movement. */
  useEffect(() => {
    plottable.forEach((idea) => {
      const pin = elementsRef.current.get(idea.id);
      if (!pin) return;
      const distance = pin.querySelector('.map-pin__distance');
      const selected = preview?.id === idea.id;
      pin.classList.toggle('map-pin--selected', selected);
      pin.classList.toggle('map-pin--liked', showVoting && isLiked(idea));

      if (preview && !selected && distance) {
        distance.textContent = formatDistance(distanceKm(preview, idea));
      } else if (distance) {
        distance.textContent = '';
      }
      const marker = markersRef.current.get(idea.id);
      if (marker) marker.zIndex = selected ? 10 : 1;
    });
  }, [ready, preview, plottable, showVoting]);

  const closePreview = useCallback(() => setPreviewId(null), []);

  if (error) {
    return (
      <div className="map-frame map-frame--message">
        <p><strong>The map could not load.</strong></p>
        <p className="map-note">{error}</p>
      </div>
    );
  }

  /* Distinguish "nothing here" from "nothing matched". Previously the
     toggle simply vanished when nothing was mappable, which read as a
     broken feature rather than missing data. */
  if (plottable.length === 0) {
    return (
      <div className="map-frame map-frame--message">
        <MapPinned size={26} strokeWidth={1.5} aria-hidden="true" />
        <p><strong>{ideas.length === 0 ? 'Nothing to map yet' : 'None of these are on the map'}</strong></p>
        <p className="map-note">
          {ideas.length === 0
            ? 'Ideas appear here once they have a Google Maps link.'
            : 'Add a Google Maps link to an idea to place it here.'}
        </p>
      </div>
    );
  }

  const location = preview ? [preview.city, preview.country].filter(Boolean).join(', ') : '';

  return (
    <div className="map-shell">
      <div className="map-frame" ref={container} role="application" aria-label="Map of ideas" />

      {preview && (
        <div className="map-preview">
          <button
            className="map-preview__body"
            type="button"
            onClick={() => onOpen(preview)}
            aria-label={`Open ${preview.title}`}
          >
            <div className="map-preview__media">
              {preview.imageUrl
                ? <img src={preview.imageUrl} alt="" />
                : <div className="card__placeholder"><ImageIcon size={22} strokeWidth={1.6} aria-hidden="true" /></div>}
            </div>
            <div className="map-preview__text">
              <strong>{preview.title}</strong>
              {location && <span className="map-preview__meta"><MapPin size={12} aria-hidden="true" />{location}</span>}
              <CategoryTagList category={preview.category} tags={preview.tags} max={1} />
            </div>
          </button>

          <div className="map-preview__actions">
            {showVoting && (
              <VoteControls
                ideaId={preview.id}
                viewerId={preview.viewerId}
                currentVote={preview.currentVote}
                partnerVote={preview.partnerVote}
                viewerTraveler={preview.viewerTraveler}
              />
            )}
            <button className="map-preview__close" type="button" onClick={closePreview} aria-label="Close preview">
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
