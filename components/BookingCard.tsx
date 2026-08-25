import Link from 'next/link';
import { BedDouble, CalendarDays, Plane, Ticket, TrainFront } from 'lucide-react';
import type { Booking } from '@/lib/bookings';
import { formatBookingDateTime } from '@/lib/datetime';

function typeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function BookingCard({ booking }: { booking: Booking }) {
  const Icon = booking.type === 'flight' ? Plane : booking.type === 'hotel' ? BedDouble : booking.type === 'train' ? TrainFront : booking.type === 'ticket' ? Ticket : CalendarDays;
  return <Link className="booking-card" href={`/bookings/${booking.id}`}><div className="booking-card-top"><Icon className={`booking-icon booking-${booking.type}`} size={22} strokeWidth={1.8} aria-hidden="true" /><span className="type-chip">{typeLabel(booking.type)}</span></div><h3>{booking.title}</h3>{booking.cityRoute && <div className="booking-route">{booking.cityRoute}</div>}<div className="booking-meta">{booking.startsAt ? formatBookingDateTime(booking.startsAt, booking.timezone) : 'Date not added'}{booking.provider && <> · {booking.provider}</>}</div>{booking.confirmation && <div className="booking-confirmation"><span>Confirmation</span><strong>{booking.confirmation}</strong></div>}</Link>;
}
