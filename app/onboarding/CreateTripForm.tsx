'use client';

import { useActionState } from 'react';
import { createTrip, type CreateTripState } from './actions';
import { Field, Input } from '@/components/ui/FormControls';

const initialState: CreateTripState = { error: null };

export function CreateTripForm() {
  const [state, formAction, isPending] = useActionState(createTrip, initialState);

  return (
    <form className="stack-form" action={formAction}>
      <Field htmlFor="trip-name" label="Trip name" required><Input id="trip-name" name="name" required maxLength={100} placeholder="Korea + Japan" /></Field>

      <div className="form-columns">
        <Field htmlFor="start-date" label="Start date"><Input id="start-date" name="startDate" type="date" /></Field>
        <Field htmlFor="end-date" label="End date"><Input id="end-date" name="endDate" type="date" /></Field>
      </div>

      <Field htmlFor="timezone" label="Trip timezone" required hint="Use an IANA timezone such as Asia/Tokyo or America/New_York."><Input id="timezone" name="timezone" required defaultValue="Asia/Tokyo" /></Field>

      <button className="primary-button" disabled={isPending} type="submit">
        {isPending ? 'Creating trip…' : 'Create trip'}
      </button>
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
    </form>
  );
}
