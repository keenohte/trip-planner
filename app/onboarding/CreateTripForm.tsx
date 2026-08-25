'use client';

import { useActionState } from 'react';
import { createTrip, type CreateTripState } from './actions';

const initialState: CreateTripState = { error: null };

export function CreateTripForm() {
  const [state, formAction, isPending] = useActionState(createTrip, initialState);

  return (
    <form className="stack-form" action={formAction}>
      <label htmlFor="trip-name">Trip name</label>
      <input id="trip-name" name="name" required maxLength={100} placeholder="Korea + Japan" />

      <div className="form-columns">
        <div>
          <label htmlFor="start-date">Start date</label>
          <input id="start-date" name="startDate" type="date" />
        </div>
        <div>
          <label htmlFor="end-date">End date</label>
          <input id="end-date" name="endDate" type="date" />
        </div>
      </div>

      <label htmlFor="timezone">Trip timezone</label>
      <input id="timezone" name="timezone" required defaultValue="Asia/Tokyo" />
      <small>Use an IANA timezone such as Asia/Tokyo or America/New_York.</small>

      <button className="primary-button" disabled={isPending} type="submit">
        {isPending ? 'Creating trip…' : 'Create trip'}
      </button>
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
    </form>
  );
}

