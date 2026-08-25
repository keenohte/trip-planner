import { RealtimeRefresh } from '@/components/RealtimeRefresh';
import { getIdeas } from '@/lib/ideas';
import { getCurrentTrip } from '@/lib/trips';
import { IdeasBrowser } from './IdeasBrowser';

export default async function IdeasPage() {
  const trip = await getCurrentTrip();
  const ideas = trip ? await getIdeas(trip.id) : [];
  const openIdeas = ideas.filter((idea) => !idea.isConfirmed);
  return <>{trip && <RealtimeRefresh tripId={trip.id} ideaIds={ideas.map((idea) => idea.id)} />}{trip && <IdeasBrowser ideas={openIdeas} timezone={trip.timezone} />}</>;
}
