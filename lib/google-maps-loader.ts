/* Loads the Maps JavaScript API once per page, then explicitly imports the
   three libraries used by IdeaMap. This follows Google's dynamic-library
   bootstrap rather than assuming a direct script callback has populated
   every constructor on the global namespace. */

export type MapsApi = {
  Map: typeof google.maps.Map;
  LatLngBounds: typeof google.maps.LatLngBounds;
  AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement;
};

type BootstrapMaps = {
  importLibrary?: (name: string) => Promise<unknown>;
  __ib__?: () => void;
};

type BootstrapWindow = {
  google?: { maps?: BootstrapMaps };
};

let loader: Promise<MapsApi> | null = null;

function installDynamicLoader(apiKey: string) {
  const browser = window as unknown as BootstrapWindow;
  const googleNamespace = browser.google ?? (browser.google = {});
  const maps = googleNamespace.maps ?? (googleNamespace.maps = {});
  if (maps.importLibrary) return;

  const requested = new Set<string>();
  let bootstrap: Promise<void> | null = null;

  const importLibrary = (name: string): Promise<unknown> => {
    requested.add(name);

    if (!bootstrap) {
      bootstrap = new Promise<void>((resolve, reject) => {
        /* Promise.all calls importLibrary three times in the same turn. Wait
           one microtask so all requested libraries are included in the
           initial Google request, matching the official bootstrap. */
        queueMicrotask(() => {
          const endpoint = new URL('https://maps.googleapis.com/maps/api/js');
          endpoint.searchParams.set('key', apiKey);
          endpoint.searchParams.set('v', 'weekly');
          endpoint.searchParams.set('loading', 'async');
          endpoint.searchParams.set('libraries', [...requested].join(','));
          endpoint.searchParams.set('callback', 'google.maps.__ib__');

          const timer = window.setTimeout(
            () => reject(new Error('Google Maps timed out. Check the API key and its website restrictions.')),
            12000,
          );
          maps.__ib__ = () => {
            window.clearTimeout(timer);
            resolve();
          };

          const script = document.createElement('script');
          script.src = endpoint.toString();
          script.async = true;
          script.onerror = () => {
            window.clearTimeout(timer);
            reject(new Error('Google Maps could not load. Check the API key and its website restrictions.'));
          };
          document.head.appendChild(script);
        });
      });
    }

    return bootstrap.then(() => {
      const loadedImport = maps.importLibrary;
      if (!loadedImport || loadedImport === importLibrary) {
        throw new Error('Google Maps loaded without its library importer.');
      }
      return loadedImport(name);
    });
  };

  maps.importLibrary = importLibrary;
}

function isComplete(api: Partial<MapsApi>): api is MapsApi {
  return typeof api.Map === 'function'
    && typeof api.LatLngBounds === 'function'
    && typeof api.AdvancedMarkerElement === 'function';
}

async function resolveApi(): Promise<MapsApi> {
  const maps = window.google?.maps;
  if (typeof maps?.importLibrary !== 'function') {
    throw new Error('Google Maps loaded without its library importer.');
  }

  const [core, mapsLibrary, markerLibrary] = await Promise.all([
    maps.importLibrary('core') as Promise<{ LatLngBounds: typeof google.maps.LatLngBounds }>,
    maps.importLibrary('maps') as Promise<{ Map: typeof google.maps.Map }>,
    maps.importLibrary('marker') as Promise<{ AdvancedMarkerElement: typeof google.maps.marker.AdvancedMarkerElement }>,
  ]);
  const api = {
    Map: mapsLibrary.Map,
    LatLngBounds: core.LatLngBounds,
    AdvancedMarkerElement: markerLibrary.AdvancedMarkerElement,
  };
  if (!isComplete(api)) {
    const missing = Object.entries(api)
      .filter(([, value]) => typeof value !== 'function')
      .map(([name]) => name);
    throw new Error(`Maps API incomplete — missing: ${missing.join(', ')}.`);
  }
  return api;
}

export function loadGoogleMaps(): Promise<MapsApi> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Maps can only load in the browser.'));
  if (loader) return loader;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
  if (!apiKey) return Promise.reject(new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY.'));

  installDynamicLoader(apiKey);
  loader = resolveApi().catch((error) => {
    loader = null;
    throw error;
  });
  return loader;
}
