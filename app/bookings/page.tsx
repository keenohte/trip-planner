import { BookingCard } from '@/components/BookingCard';
import { BookingsRealtimeRefresh } from '@/components/BookingsRealtimeRefresh';
import { NewBookingTrigger } from '@/components/CreateRecordTriggers';
import { getBookings } from '@/lib/bookings';
import { getCurrentTrip } from '@/lib/trips';

export default async function BookingsPage() {
  const trip = await getCurrentTrip();
  const bookings = trip ? await getBookings(trip.id, trip.timezone) : [];
  return <>{trip && <BookingsRealtimeRefresh tripId={trip.id} />}<div className="simple-page-toolbar"><div><h2>Bookings</h2><p>Flights, stays, tickets, and reservations.</p></div><NewBookingTrigger className="primary-link" timezone={trip?.timezone ?? 'UTC'}>+ Add Booking</NewBookingTrigger></div>{bookings.length > 0 ? <div className="booking-grid">{bookings.map((booking) => <BookingCard booking={booking} key={booking.id} />)}</div> : <section className="empty-state"><h3>No bookings yet</h3><p>Add a flight, hotel, train, restaurant, ticket, or experience.</p><NewBookingTrigger className="primary-link" timezone={trip?.timezone ?? 'UTC'}>Add your first Booking</NewBookingTrigger></section>}</>;
}
