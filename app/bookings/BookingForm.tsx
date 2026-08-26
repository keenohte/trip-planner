'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DateTimePicker } from '@/components/DateTimePicker';
import { ModalFormLayout } from '@/components/ModalFormLayout';
import { Field, Input, Select, Textarea } from '@/components/ui/FormControls';
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
    <Field htmlFor="booking-title" label="Title" required><Input id="booking-title" name="title" required maxLength={160} defaultValue={booking?.title ?? ''} placeholder="Asiana OZ221" /></Field>
    <div className="form-columns"><Field htmlFor="booking-type" label="Type"><Select id="booking-type" name="type" defaultValue={booking?.type ?? 'flight'}>{bookingTypes.map((type) => <option value={type} key={type}>{label(type)}</option>)}</Select></Field><Field htmlFor="booking-route" label="City or route"><Input id="booking-route" name="cityRoute" defaultValue={booking?.cityRoute ?? ''} placeholder="JFK → ICN" /></Field></div>
    <Field htmlFor="booking-provider" label="Provider"><Input id="booking-provider" name="provider" defaultValue={booking?.provider ?? ''} placeholder="Asiana Airlines" /></Field>
    <div className="form-columns date-time-fields"><Field htmlFor="booking-start" label="Start date"><DateTimePicker id="booking-start" name="startsAt" initialValue={formatDateTimeInput(booking?.startsAt ?? null, timezone)} /></Field><Field htmlFor="booking-end" label="End date"><DateTimePicker id="booking-end" name="endsAt" initialValue={formatDateTimeInput(booking?.endsAt ?? null, timezone)} /></Field></div>
    <Field htmlFor="booking-timezone" label="Timezone" hint="Use an IANA timezone. A start time adds this booking to Schedule."><Input id="booking-timezone" name="timezone" defaultValue={timezone} placeholder="Asia/Tokyo" /></Field>
    <div className="form-columns"><Field htmlFor="booking-confirmation" label="Confirmation number"><Input id="booking-confirmation" name="confirmation" defaultValue={booking?.confirmation ?? ''} /></Field><Field htmlFor="booking-link" label="Booking link"><Input id="booking-link" name="bookingUrl" type="url" defaultValue={booking?.bookingUrl ?? ''} placeholder="https://…" /></Field></div>
    <Field htmlFor="booking-notes" label="Notes"><Textarea id="booking-notes" name="notes" rows={5} defaultValue={booking?.notes ?? ''} placeholder="Terminal, check-in instructions, cancellation details…" /></Field>
  </>;

  if (presentation === 'modal') return <ModalFormLayout action={formAction} error={state.error} pending={isPending} onCancel={() => onCancel?.()}>{fields}</ModalFormLayout>;
  return <form className="idea-form booking-form" action={formAction}>{fields}{state.error && <p className="auth-error" role="alert">{state.error}</p>}<div className="form-actions"><a className="secondary-link" href={booking ? `/bookings/${booking.id}` : '/bookings'}>Cancel</a><button className="primary-button" disabled={isPending} type="submit">{isPending ? 'Saving…' : 'Save'}</button></div></form>;
}
