import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBooking } from '@/lib/bookings';
import { formatBookingDateTime } from '@/lib/datetime';
import { getCurrentTrip } from '@/lib/trips';

type BookingDetailPageProps = { params: Promise<{ id: string }> };

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
  const [{ id }, trip] = await Promise.all([params, getCurrentTrip()]);
  if (!trip) notFound();
  const booking = await getBooking(trip.id, id, trip.timezone);
  if (!booking) notFound();
  return <><div className="detail-toolbar"><Link className="secondary-link" href="/bookings">← All Bookings</Link><Link className="primary-link" href={`/bookings/${booking.id}/edit`}>Edit Booking</Link></div><article className="booking-detail"><div className="idea-kicker">{booking.type}</div><h2>{booking.title}</h2>{booking.cityRoute && <div className="booking-route">{booking.cityRoute}</div>}<div className="booking-facts">{booking.startsAt && <div><span>Start</span><strong>{formatBookingDateTime(booking.startsAt, booking.timezone)}</strong></div>}{booking.endsAt && <div><span>End</span><strong>{formatBookingDateTime(booking.endsAt, booking.timezone)}</strong></div>}<div><span>Timezone</span><strong>{booking.timezone}</strong></div>{booking.provider && <div><span>Provider</span><strong>{booking.provider}</strong></div>}{booking.confirmation && <div className="confirmation-fact"><span>Confirmation</span><strong>{booking.confirmation}</strong></div>}</div>{booking.notes && <p className="idea-notes">{booking.notes}</p>}{booking.bookingUrl && <a className="primary-link" href={booking.bookingUrl} target="_blank" rel="noreferrer">Open Booking ↗</a>}</article></>;
}
