/* Loads the Maps JavaScript API exactly once per page.

   The script tag is global, so a naive per-component loader would inject
   duplicates when the map mounts and unmounts (toggling Map/List). This
   memoises the promise: every caller after the first awaits the same load. */

declare global {
  interface Window {
    google?: typeof google;
  }
}

let loader: Promise<typeof google.maps> | null = null;

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Maps can only load in the browser.'));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loader) return loader;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
  if (!apiKey) return Promise.reject(new Error('Missing Google Maps API key.'));

  loader = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const endpoint = new URL('https://maps.googleapis.com/maps/api/js');
    endpoint.searchParams.set('key', apiKey);
    endpoint.searchParams.set('libraries', 'marker');
    endpoint.searchParams.set('loading', 'async');
    endpoint.searchParams.set('v', 'weekly');
    script.src = endpoint.toString();
    script.async = true;
    script.onload = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error('Google Maps failed to initialise.'));
    };
    script.onerror = () => {
      /* Let a later attempt retry rather than caching the failure —
         a referrer restriction or a blocked request should not
         permanently disable the map for the session. */
      loader = null;
      reject(new Error('Google Maps could not load.'));
    };
    document.head.appendChild(script);
  });

  return loader;
}
