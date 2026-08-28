const googleMapsHosts = new Set(['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl', 'goo.gl']);

function isGoogleMapsHost(hostname: string) {
  const host = hostname.toLowerCase();
  return googleMapsHosts.has(host) || host.endsWith('.google.com');
}

export function isGoogleMapsUrl(value: string) {
  try { return isGoogleMapsHost(new URL(value).hostname); } catch { return false; }
}

function addressFromUrl(url: URL) {
  for (const key of ['query', 'q', 'destination', 'daddr']) {
    const value = url.searchParams.get(key)?.trim();
    if (value && !/^[-\d.]+,[-\d.]+$/.test(value)) return value;
  }
  const match = url.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/i);
  if (!match) return null;
  try { return decodeURIComponent(match[1].replace(/\+/g, ' ')).trim() || null; }
  catch { return match[1].replace(/\+/g, ' ').trim() || null; }
}

function coordinatesFromUrl(url: URL) {
  const marker = url.toString().match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (marker) return `${marker[1]},${marker[2]}`;
  const center = url.toString().match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  return center ? `${center[1]},${center[2]}` : null;
}

async function resolveGoogleRedirect(value: string) {
  let current = new URL(value);
  for (let count = 0; count < 5; count += 1) {
    if (!isGoogleMapsHost(current.hostname)) return null;
    const response = await fetch(current, { method: 'HEAD', redirect: 'manual', cache: 'no-store' });
    if (response.status < 300 || response.status >= 400) return current;
    const location = response.headers.get('location');
    if (!location) return current;
    current = new URL(location, current);
  }
  return current;
}

export type ResolvedPlace = {
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  title: string | null;
  country: string | null;
  city: string | null;
  neighborhood: string | null;
};

const EMPTY_PLACE: ResolvedPlace = {
  address: null, latitude: null, longitude: null,
  title: null, country: null, city: null, neighborhood: null,
};

type AddressComponent = { long_name?: string; short_name?: string; types?: string[] };

/* The geocoding response has always carried address_components; only
   formatted_address was being read. Parsing the rest costs no extra
   call. Locality is the usual city, but Japanese addresses often use
   the ward-level types instead, so fall through a list. */
function pick(components: AddressComponent[], types: string[]): string | null {
  for (const type of types) {
    const hit = components.find((component) => component.types?.includes(type));
    if (hit?.long_name) return hit.long_name;
  }
  return null;
}

function partsFromComponents(components: AddressComponent[]) {
  return {
    country: pick(components, ['country']),
    city: pick(components, ['locality', 'postal_town', 'administrative_area_level_2', 'administrative_area_level_1']),
    neighborhood: pick(components, ['neighborhood', 'sublocality_level_1', 'sublocality', 'ward']),
  };
}

/* The place name sits in the URL path — /maps/place/Fushimi+Inari+Taisha/.
   Free, and more faithful than anything geocoding returns, since it is
   the name the person actually saw. Coordinate strings and plus-codes
   are not names, so they are rejected. */
function titleFromUrl(url: URL): string | null {
  const match = url.pathname.match(/\/maps\/place\/([^/@]+)/i);
  if (!match) return null;
  let value: string;
  try { value = decodeURIComponent(match[1].replace(/\+/g, ' ')).trim(); }
  catch { value = match[1].replace(/\+/g, ' ').trim(); }
  if (!value) return null;
  if (/^[-\d.]+,\s*[-\d.]+$/.test(value)) return null;
  if (/^[23456789CFGHJMPQRVWX]{4,}\+[23456789CFGHJMPQRVWX]{2,}/i.test(value)) return null;
  return value.slice(0, 160);
}

function parseCoordinatePair(value: string | null): { latitude: number; longitude: number } | null {
  if (!value) return null;
  const parts = value.split(',').map((part) => part.trim());
  /* Guard the empty-string case explicitly: Number('') is 0, so "35.0,"
     would otherwise parse as a valid point at longitude 0 — a pin in the
     Gulf of Guinea rather than a failed parse. */
  if (parts.length !== 2 || parts.some((part) => part === '')) return null;
  const [lat, lng] = parts.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { latitude: lat, longitude: lng };
}

/* Returns the address AND the coordinates.
   Both were already being computed — coordinatesFromUrl() reads them
   straight out of the map URL, and the Geocoding response carries
   geometry.location. Only formatted_address was kept. No extra API
   calls; when the URL contains coordinates there is no API call at all. */
export async function resolveGoogleMapsPlace(value: string | null): Promise<ResolvedPlace> {
  if (!value || !isGoogleMapsUrl(value)) return EMPTY_PLACE;
  try {
    const resolved = await resolveGoogleRedirect(value) ?? new URL(value);
    const fallbackAddress = addressFromUrl(resolved);
    const urlCoordinates = coordinatesFromUrl(resolved);
    const fromUrl = parseCoordinatePair(urlCoordinates);

    const title = titleFromUrl(resolved);
    const base = {
      address: fallbackAddress,
      latitude: fromUrl?.latitude ?? null,
      longitude: fromUrl?.longitude ?? null,
      title,
      country: null,
      city: null,
      neighborhood: null,
    };

    const lookup = urlCoordinates ?? fallbackAddress;
    const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
    if (!apiKey || !lookup) return base;

    const endpoint = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    endpoint.searchParams.set(/^[-\d.]+,[-\d.]+$/.test(lookup) ? 'latlng' : 'address', lookup);
    endpoint.searchParams.set('key', apiKey);
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) return base;

    const payload = await response.json() as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        address_components?: AddressComponent[];
        geometry?: { location?: { lat?: number; lng?: number } };
      }>;
    };
    if (payload.status !== 'OK') return base;

    const top = payload.results?.[0];
    const geo = top?.geometry?.location;
    /* Prefer coordinates from the URL: they point at the exact pin the
       person shared, whereas geocoding an address can land on a street
       centroid or the wrong entrance of a large site. */
    const latitude = fromUrl?.latitude ?? (Number.isFinite(geo?.lat) ? geo!.lat! : null);
    const longitude = fromUrl?.longitude ?? (Number.isFinite(geo?.lng) ? geo!.lng! : null);

    const parts = partsFromComponents(top?.address_components ?? []);
    return { address: top?.formatted_address ?? fallbackAddress, latitude, longitude, title, ...parts };
  } catch {
    return EMPTY_PLACE;
  }
}

/** @deprecated Use resolveGoogleMapsPlace, which also returns coordinates. */
export async function resolveGoogleMapsAddress(value: string | null) {
  return (await resolveGoogleMapsPlace(value)).address;
}

export function googleMapsEmbedUrl(address: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
  if (!apiKey) return null;
  const endpoint = new URL('https://www.google.com/maps/embed/v1/place');
  endpoint.searchParams.set('key', apiKey);
  endpoint.searchParams.set('q', address);
  return endpoint.toString();
}
