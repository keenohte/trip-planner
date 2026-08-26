import Link from 'next/link';
import { BedDouble, CalendarDays, Plane, Ticket, TrainFront } from 'lucide-react';
import { Chip } from '@/components/ui/Card';
import type { Booking } from '@/lib/bookings';
import { formatBookingDateTime } from '@/lib/datetime';

const icons: Record<string, typeof Plane> = {
  flight: Plane,
  hotel: BedDouble,
  train: TrainFront,
  ticket: Ticket,
};

function typeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function BookingCard({ booking }: { booking: Booking }) {
  const Icon = icons[booking.type] ?? CalendarDays;
  return (
    <Link className="card card--interactive" href={`/bookings/${booking.id}`}>
      <div className="card__body">
        <div className="booking-card__top">
          <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
          <Chip>{typeLabel(booking.type)}</Chip>
        </div>
        <h3 className="card__title">{booking.title}</h3>
        {booking.cityRoute && <div className="booking-card__route">{booking.cityRoute}</div>}
        <div className="card__meta">
          {booking.startsAt ? formatBookingDateTime(booking.startsAt, booking.timezone) : 'Date not added'}
          {booking.provider && <> · {booking.provider}</>}
        </div>
      </div>
      {booking.confirmation && (
        <div className="card__footer">
          <span className="card__meta">Confirmation</span>
          <strong>{booking.confirmation}</strong>
        </div>
      )}
    </Link>
  );
}
