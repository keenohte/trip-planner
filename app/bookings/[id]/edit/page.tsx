import { notFound } from 'next/navigation';
import { BookingForm } from '../../BookingForm';
import { deleteBooking } from '../../actions';
import { getBooking } from '@/lib/bookings';
import { getCurrentTrip } from '@/lib/trips';

type EditBookingPageProps = { params: Promise<{ id: string }> };

export default async function EditBookingPage({ params }: EditBookingPageProps) {
  const [{ id }, trip] = await Promise.all([params, getCurrentTrip()]);
  if (!trip) notFound();
  const booking = await getBooking(trip.id, id, trip.timezone);
  if (!booking) notFound();
  return <><section className="hero compact-hero"><div className="eyebrow">Booking details</div><h2>Edit {booking.title}</h2><p>Keep confirmation and timing details accurate for both travelers.</p></section><BookingForm booking={booking} tripTimezone={trip.timezone} /><form className="delete-form" action={deleteBooking}><input type="hidden" name="bookingId" value={booking.id} /><button className="danger-button" type="submit">Delete Booking</button></form></>;
}
