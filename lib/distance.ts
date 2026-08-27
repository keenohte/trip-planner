export type Point = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;
const toRadians = (value: number) => (value * Math.PI) / 180;

/* Great-circle distance. Deliberately not a routing call: this runs
   locally, costs nothing, and answers the question that matters when
   planning a day — "are these two near each other?"

   It is straight-line, so real walking distance is longer, more so in a
   city cut by a river or a rail line. If precise travel time becomes
   worth paying for, the Routes API is the upgrade. */
export function distanceKm(from: Point, to: Point): number {
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
