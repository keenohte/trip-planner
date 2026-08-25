import { BookingsRealtimeRefresh } from '@/components/BookingsRealtimeRefresh';
import { RealtimeRefresh } from '@/components/RealtimeRefresh';
import { ScheduleBrowser } from '@/components/ScheduleBrowser';
import { ScheduleRealtimeRefresh } from '@/components/ScheduleRealtimeRefresh';
import { getSchedule } from '@/lib/schedule';
import { getCurrentTrip } from '@/lib/trips';

export default async function SchedulePage(){
  const trip=await getCurrentTrip();const groups=trip?await getSchedule(trip):[];
  return <>{trip&&<><RealtimeRefresh tripId={trip.id} ideaIds={[]}/><BookingsRealtimeRefresh tripId={trip.id}/><ScheduleRealtimeRefresh tripId={trip.id}/><ScheduleBrowser groups={groups} timezone={trip.timezone}/></>}{!trip&&<section className="empty-state"><h3>No trip found</h3><p>Create a trip before building a schedule.</p></section>}</>;
}
