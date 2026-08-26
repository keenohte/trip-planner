'use client';

import { useState } from 'react';
import { BedDouble, CalendarDays, Plane, Ticket, TrainFront } from 'lucide-react';
import { BookingModal } from '@/components/BookingModal';
import { CardBody, CardButton, CardFooter, Chip } from '@/components/ui/Card';
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
  const [open, setOpen] = useState(false);
  const Icon = icons[booking.type] ?? CalendarDays;
  return (
    <>
      <CardButton onClick={() => setOpen(true)} aria-label={`Open ${booking.title}`}>
        <CardBody>
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
        </CardBody>
        {booking.confirmation && (
          <CardFooter>
            <span className="card__meta">Booking number</span>
            <strong>{booking.confirmation}</strong>
          </CardFooter>
        )}
      </CardButton>
      {open && <BookingModal booking={booking} timezone={booking.timezone} onClose={() => setOpen(false)} />}
    </>
  );
}
