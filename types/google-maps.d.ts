/* Minimal declarations for the Maps JavaScript API surface this app uses.

   Deliberately not @types/google.maps: that package is large, and pulling
   it in would mean a dependency install for types we barely touch. If the
   map grows past a handful of calls, swap this file for the real package. */

declare namespace google.maps {
  class LatLngBounds {
    constructor();
    extend(point: { lat: number; lng: number }): void;
    isEmpty(): boolean;
    getCenter(): { lat(): number; lng(): number };
  }

  class Map {
    constructor(element: HTMLElement, options: MapOptions);
    fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
    setCenter(position: { lat: number; lng: number }): void;
    setZoom(zoom: number): void;
    addListener(event: string, handler: () => void): void;
  }

  interface Padding { top: number; right: number; bottom: number; left: number }

  interface MapOptions {
    center: { lat: number; lng: number };
    zoom: number;
    mapId?: string;
    disableDefaultUI?: boolean;
    zoomControl?: boolean;
    clickableIcons?: boolean;
    gestureHandling?: string;
  }

  namespace marker {
    class AdvancedMarkerElement {
      constructor(options: {
        map?: Map | null;
        position: { lat: number; lng: number };
        content?: HTMLElement;
        title?: string;
        zIndex?: number;
      });
      map: Map | null;
      addListener(event: string, handler: () => void): void;
    }
  }
}

declare const google: typeof google;
