'use client';

import { useState } from 'react';
import { Building2, CalendarClock, Hash, Link2, MapPin, MoreHorizontal, NotebookText, Pencil, Trash2 } from 'lucide-react';
import { BookingForm } from '@/app/bookings/BookingForm';
import { deleteBooking } from '@/app/bookings/actions';
import { DismissibleDetails } from '@/components/DismissibleDetails';
import { GoogleMapEmbed } from '@/components/GoogleMapEmbed';
import { ModalFrame } from '@/components/ModalFrame';
import { Chip } from '@/components/ui/Card';
import { DetailPanel, DetailRow } from '@/components/ui/DetailPanel';
import type { Booking } from '@/lib/bookings';
import { formatBookingDateTime } from '@/lib/datetime';

function typeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function BookingModal({ booking, timezone, onClose }: { booking?: Booking; timezone: string; onClose: () => void }) {
  const [editing, setEditing] = useState(!booking);
  const address = booking?.locationAddress ?? booking?.cityRoute ?? null;
  const mapQuery = address ?? booking?.title ?? '';
  const links = booking
    ? [['Website', booking.websiteUrl], ['Booking', booking.bookingUrl]].filter((entry): entry is [string, string] => Boolean(entry[1]))
    : [];
  const hasDetails = Boolean(booking && (booking.startsAt || booking.provider || booking.confirmation || booking.notes || links.length > 0 || (booking.mapsUrl && address)));

  return (
    <ModalFrame className={editing ? 'is-editing' : 'booking-modal'} onClose={onClose} labelledBy={!editing ? 'booking-modal-title' : undefined}>
      {editing ? (
        <BookingForm booking={booking} tripTimezone={timezone} onCancel={() => booking ? setEditing(false) : onClose()} onSaved={onClose} />
      ) : booking && (
        <div className="idea-modal-content booking-modal-content">
          <header className="idea-modal-summary">
            <div className="booking-modal-heading">
              <h2 id="booking-modal-title">{booking.title}</h2>
              <DismissibleDetails className="idea-kebab" summary={<MoreHorizontal size={20} aria-hidden="true" />} summaryLabel="Booking actions">
                <div>
                  <button type="button" onClick={() => setEditing(true)}><Pencil size={14} aria-hidden="true" />Edit</button>
                  <form action={deleteBooking}>
                    <input type="hidden" name="bookingId" value={booking.id} />
                    <button className="danger-menu-action" type="submit"><Trash2 size={14} aria-hidden="true" />Delete</button>
                  </form>
                </div>
              </DismissibleDetails>
            </div>
            <div className="idea-modal-summary-meta">
              {booking.cityRoute && <p className="idea-modal-location">{booking.cityRoute}</p>}
              <div className="chip-list"><Chip>{typeLabel(booking.type)}</Chip></div>
            </div>
          </header>

          {hasDetails && <DetailPanel>
            {booking.startsAt && <DetailRow icon={<CalendarClock aria-hidden="true" />} label="Schedule">
              {formatBookingDateTime(booking.startsAt, booking.timezone)}{booking.endsAt && <> → {formatBookingDateTime(booking.endsAt, booking.timezone)}</>}
            </DetailRow>}
            {booking.provider && <DetailRow icon={<Building2 aria-hidden="true" />} label="Provider">{booking.provider}</DetailRow>}
            {booking.confirmation && <DetailRow icon={<Hash aria-hidden="true" />} label="Booking">{booking.confirmation}</DetailRow>}
            {booking.notes && <DetailRow icon={<NotebookText aria-hidden="true" />} label="Notes">{booking.notes}</DetailRow>}
            {links.length > 0 && <DetailRow icon={<Link2 aria-hidden="true" />} label="Links">
              <span className="detail-link-list">{links.map(([label, url], index) => <span key={label}>{index > 0 && <span aria-hidden="true">·</span>}<a href={url} target="_blank" rel="noreferrer">{label}</a></span>)}</span>
            </DetailRow>}
            {booking.mapsUrl && address && <DetailRow icon={<MapPin aria-hidden="true" />} label="Location">{address}</DetailRow>}
          </DetailPanel>}

          {booking.mapsUrl && <GoogleMapEmbed address={mapQuery} mapsUrl={booking.mapsUrl} />}
        </div>
      )}
    </ModalFrame>
  );
}
