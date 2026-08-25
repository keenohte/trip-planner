import { RealtimeRefresh } from '@/components/RealtimeRefresh';
import { IdeasBrowser } from '@/app/ideas/IdeasBrowser';
import { getIdeas } from '@/lib/ideas';
import { getCurrentTrip } from '@/lib/trips';

export default async function ConfirmedPage() {
  const trip = await getCurrentTrip();
  const ideas = trip ? await getIdeas(trip.id) : [];
  const confirmedIdeas = ideas.filter((idea) => idea.isConfirmed);
  return <>{trip && <RealtimeRefresh tripId={trip.id} ideaIds={ideas.map((idea) => idea.id)} />}{trip && <IdeasBrowser ideas={confirmedIdeas} timezone={trip.timezone} variant="confirmed" />}</>;
}
