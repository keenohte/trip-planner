/* Loads the Maps JavaScript API once per page and hands back the exact
   constructors the map needs.

   Two failed approaches are worth recording so nobody repeats them:

   1. Resolving on script.onload and reading google.maps.Map — onload
      fires when the bootstrap lands, not when libraries are populated.
      Works on a warm cache, throws "maps.Map is not a constructor" on a
      cold one.
   2. Resolving on google.maps.importLibrary — that function comes from
      Google's inline bootstrap snippet and is not guaranteed to exist
      when loading via a plain script tag.

   The reliable signal is the `callback` query parameter: Google invokes
   it only once the API is fully initialised. We still prefer
   importLibrary when it happens to be present, since it is the forward
   path, but we never depend on it. */

export type MapsApi = {
  Map: typeof google.maps.Map;
  LatLngBounds: typeof google.maps.LatLngBounds;
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
};

const CALLBACK_NAME = '__tripHubMapsReady';

let loader: Promise<MapsApi> | null = null;

function readFromGlobal(): MapsApi {
  const maps = window.google?.maps;
  const candidate = {
    Map: maps?.Map,
    LatLngBounds: maps?.LatLngBounds,
    AdvancedMarkerElement: maps?.marker?.AdvancedMarkerElement,
  };
  if (isComplete(candidate)) return candidate;
  const missing = Object.entries(candidate).filter(([, value]) => typeof value !== 'function').map(([name]) => name);
  throw new Error(`Maps API incomplete — missing: ${missing.join(', ')}.`);
}

/* Every constructor must be present. Returning a partially-populated
   object is how "api.LatLngBounds is not a constructor" happened:
   importLibrary('maps') provides Map but NOT LatLngBounds, which lives in
   the 'core' library. Validate, then fall back rather than trust. */
function isComplete(api: Partial<MapsApi>): api is MapsApi {
  return typeof api.Map === 'function'
    && typeof api.LatLngBounds === 'function'
    && typeof api.AdvancedMarkerElement === 'function';
}

async function resolveApi(): Promise<MapsApi> {
  const maps = window.google?.maps;
  if (typeof maps?.importLibrary === 'function') {
    try {
      const [core, mapsLib, markerLib] = await Promise.all([
        maps.importLibrary('core') as Promise<{ LatLngBounds: typeof google.maps.LatLngBounds }>,
        maps.importLibrary('maps') as Promise<{ Map: typeof google.maps.Map }>,
        maps.importLibrary('marker') as Promise<{ AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement }>,
      ]);
      const candidate = {
        Map: mapsLib?.Map,
        LatLngBounds: core?.LatLngBounds,
        AdvancedMarkerElement: markerLib?.AdvancedMarkerElement,
      };
      if (isComplete(candidate)) return candidate;
    } catch {
      // fall through
    }
  }
  return readFromGlobal();
}

export function loadGoogleMaps(): Promise<MapsApi> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Maps can only load in the browser.'));
  if (loader) return loader;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
  if (!apiKey) return Promise.reject(new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY.'));

  // Already initialised by an earlier mount.
  if (window.google?.maps?.Map) {
    loader = resolveApi();
    return loader;
  }

  loader = new Promise<MapsApi>((resolve, reject) => {
    const fail = (message: string) => {
      loader = null; // let a later attempt retry
      reject(new Error(message));
    };

    const timer = setTimeout(() => fail('Google Maps timed out. Check the API key and its referrer restrictions.'), 12000);

    (window as unknown as Record<string, unknown>)[CALLBACK_NAME] = () => {
      clearTimeout(timer);
      resolveApi().then(resolve).catch((cause: Error) => fail(cause.message));
    };

    const endpoint = new URL('https://maps.googleapis.com/maps/api/js');
    endpoint.searchParams.set('key', apiKey);
    endpoint.searchParams.set('v', 'weekly');
    endpoint.searchParams.set('libraries', 'marker');
    endpoint.searchParams.set('loading', 'async');
    endpoint.searchParams.set('callback', CALLBACK_NAME);

    const script = document.createElement('script');
    script.src = endpoint.toString();
    script.async = true;
    script.onerror = () => {
      clearTimeout(timer);
      fail('Google Maps could not load. Check the API key referrer restrictions.');
    };
    document.head.appendChild(script);
  });

  return loader;
}
