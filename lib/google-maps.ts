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

export async function resolveGoogleMapsAddress(value: string | null) {
  if (!value || !isGoogleMapsUrl(value)) return null;
  try {
    const resolved = await resolveGoogleRedirect(value) ?? new URL(value);
    const fallbackAddress = addressFromUrl(resolved);
    const lookup = coordinatesFromUrl(resolved) ?? fallbackAddress;
    const apiKey = process.env.GOOGLE_MAPS_GEOCODING_API_KEY;
    if (!apiKey || !lookup) return fallbackAddress;

    const endpoint = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    endpoint.searchParams.set(/^[-\d.]+,[-\d.]+$/.test(lookup) ? 'latlng' : 'address', lookup);
    endpoint.searchParams.set('key', apiKey);
    const response = await fetch(endpoint, { cache: 'no-store' });
    if (!response.ok) return fallbackAddress;
    const payload = await response.json() as { status?: string; results?: Array<{ formatted_address?: string }> };
    return payload.status === 'OK' ? payload.results?.[0]?.formatted_address ?? fallbackAddress : fallbackAddress;
  } catch { return null; }
}

export function googleMapsEmbedUrl(address: string) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;
  if (!apiKey) return null;
  const endpoint = new URL('https://www.google.com/maps/embed/v1/place');
  endpoint.searchParams.set('key', apiKey);
  endpoint.searchParams.set('q', address);
  return endpoint.toString();
}
