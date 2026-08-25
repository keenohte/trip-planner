'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DateTimePicker } from '@/components/DateTimePicker';
import { ModalFormLayout } from '@/components/ModalFormLayout';
import { bookingTypes } from '@/lib/booking-types';
import type { Booking } from '@/lib/bookings';
import { formatDateTimeInput } from '@/lib/datetime';
import { createBooking, updateBooking, type BookingFormState } from './actions';

const initialState: BookingFormState = { error: null };
const label = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function BookingForm({ booking, tripTimezone, presentation = 'page', onCancel, onSaved }: { booking?: Booking; tripTimezone: string; presentation?: 'page' | 'modal'; onCancel?: () => void; onSaved?: () => void }) {
  const [state, formAction, isPending] = useActionState(booking ? updateBooking : createBooking, initialState);
  const timezone = booking?.timezone ?? tripTimezone;
  const router = useRouter();
  useEffect(() => { if (state.saved) { router.refresh(); onSaved?.(); } }, [onSaved, router, state.saved]);

  const fields = <>
    {booking && <input type="hidden" name="bookingId" value={booking.id} />}
    <div className="form-field"><label htmlFor="booking-title">Title <span aria-hidden="true">*</span></label><input id="booking-title" name="title" required maxLength={160} defaultValue={booking?.title ?? ''} placeholder="Asiana OZ221" /></div>
    <div className="form-columns"><div className="form-field"><label htmlFor="booking-type">Type</label><select id="booking-type" name="type" defaultValue={booking?.type ?? 'flight'}>{bookingTypes.map((type) => <option value={type} key={type}>{label(type)}</option>)}</select></div><div className="form-field"><label htmlFor="booking-route">City or route</label><input id="booking-route" name="cityRoute" defaultValue={booking?.cityRoute ?? ''} placeholder="JFK → ICN" /></div></div>
    <div className="form-field"><label htmlFor="booking-provider">Provider</label><input id="booking-provider" name="provider" defaultValue={booking?.provider ?? ''} placeholder="Asiana Airlines" /></div>
    <div className="form-columns date-time-fields"><div className="form-field"><label htmlFor="booking-start">Start date</label><DateTimePicker id="booking-start" name="startsAt" initialValue={formatDateTimeInput(booking?.startsAt ?? null, timezone)} /></div><div className="form-field"><label htmlFor="booking-end">End date</label><DateTimePicker id="booking-end" name="endsAt" initialValue={formatDateTimeInput(booking?.endsAt ?? null, timezone)} /></div></div>
    <div className="form-field"><label htmlFor="booking-timezone">Timezone</label><input id="booking-timezone" name="timezone" defaultValue={timezone} placeholder="Asia/Tokyo" /><small>Use an IANA timezone. A start time adds this booking to Schedule.</small></div>
    <div className="form-columns"><div className="form-field"><label htmlFor="booking-confirmation">Confirmation number</label><input id="booking-confirmation" name="confirmation" defaultValue={booking?.confirmation ?? ''} /></div><div className="form-field"><label htmlFor="booking-link">Booking link</label><input id="booking-link" name="bookingUrl" type="url" defaultValue={booking?.bookingUrl ?? ''} placeholder="https://…" /></div></div>
    <div className="form-field"><label htmlFor="booking-notes">Notes</label><textarea id="booking-notes" name="notes" rows={5} defaultValue={booking?.notes ?? ''} placeholder="Terminal, check-in instructions, cancellation details…" /></div>
  </>;

  if (presentation === 'modal') return <ModalFormLayout action={formAction} error={state.error} pending={isPending} onCancel={() => onCancel?.()}>{fields}</ModalFormLayout>;
  return <form className="idea-form booking-form" action={formAction}>{fields}{state.error && <p className="auth-error" role="alert">{state.error}</p>}<div className="form-actions"><a className="secondary-link" href={booking ? `/bookings/${booking.id}` : '/bookings'}>Cancel</a><button className="primary-button" disabled={isPending} type="submit">{isPending ? 'Saving…' : 'Save'}</button></div></form>;
}
