'use client';

import { useActionState } from 'react';
import { acceptInvite, type AcceptInviteState } from './actions';

const initialState: AcceptInviteState = { error: null };

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(acceptInvite, initialState);

  return (
    <form className="stack-form" action={formAction}>
      <input type="hidden" name="token" value={token} />
      <button className="primary-button" disabled={isPending} type="submit">
        {isPending ? 'Joining trip…' : 'Join shared trip'}
      </button>
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
    </form>
  );
}

