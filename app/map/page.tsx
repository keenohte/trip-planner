import { MapBrowser } from '@/components/MapBrowser';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';
import { getSchedule } from '@/lib/schedule';
import { getCurrentTrip } from '@/lib/trips';

export default async function MapPage() {
  const trip = await getCurrentTrip();
  const groups = trip ? await getSchedule(trip) : [];
  const items = groups.flatMap((group) => group.items);
  return <>
    {trip && !trip.preview && <RealtimeRefresh tripId={trip.id} ideaIds={items.filter((item) => item.source === 'idea').map((item) => item.id)} />}
    {trip
      ? <MapBrowser items={items} timezone={trip.timezone} tripStart={trip.startDate} tripEnd={trip.endDate} preview={trip.preview} />
      : <section className="empty-state"><h3>No trip found</h3><p>Create a trip before opening the map.</p></section>}
  </>;
}
