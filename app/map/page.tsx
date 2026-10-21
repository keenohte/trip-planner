import { MapBrowser } from '@/components/MapBrowser';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';
import { getIdeas } from '@/lib/ideas';
import { getCurrentTrip } from '@/lib/trips';

export default async function MapPage() {
  const trip = await getCurrentTrip();
  const ideas = trip ? await getIdeas(trip.id) : [];
  const openIdeas = ideas.filter((idea) => !idea.isConfirmed);
  return <>
    {trip && !trip.preview && <RealtimeRefresh tripId={trip.id} ideaIds={ideas.map((idea) => idea.id)} />}
    {trip
      ? <MapBrowser ideas={openIdeas} timezone={trip.timezone} tripStart={trip.startDate} tripEnd={trip.endDate} preview={trip.preview} />
      : <section className="empty-state"><h3>No trip found</h3><p>Create a trip before opening the map.</p></section>}
  </>;
}
