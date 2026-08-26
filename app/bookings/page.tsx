import { BookingsBrowser } from '@/components/BookingsBrowser';
import { BookingsRealtimeRefresh } from '@/components/BookingsRealtimeRefresh';
import { getBookings } from '@/lib/bookings';
import { getCurrentTrip } from '@/lib/trips';

export default async function BookingsPage() {
  const trip = await getCurrentTrip();
  const bookings = trip ? await getBookings(trip.id, trip.timezone) : [];
  return <>{trip && <BookingsRealtimeRefresh tripId={trip.id} />}<BookingsBrowser bookings={bookings} timezone={trip?.timezone ?? 'UTC'} /></>;
}
