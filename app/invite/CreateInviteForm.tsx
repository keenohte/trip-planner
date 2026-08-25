'use client';

import { useActionState, useState } from 'react';
import { createPartnerInvite, type InviteState } from './actions';

const initialState: InviteState = { error: null, inviteUrl: null };

export function CreateInviteForm({ tripId }: { tripId: string }) {
  const [state, formAction, isPending] = useActionState(createPartnerInvite, initialState);
  const [copied, setCopied] = useState(false);

  async function copyInvite() {
    if (!state.inviteUrl) return;
    await navigator.clipboard.writeText(state.inviteUrl);
    setCopied(true);
  }

  return (
    <div className="invite-box">
      <h3>Invite your travel partner</h3>
      <p>The private link expires in seven days and can only add one partner.</p>
      {!state.inviteUrl ? (
        <form action={formAction}>
          <input type="hidden" name="tripId" value={tripId} />
          <button className="primary-button" disabled={isPending} type="submit">
            {isPending ? 'Creating invite…' : 'Create invite link'}
          </button>
        </form>
      ) : (
        <div className="invite-result">
          <input aria-label="Partner invite URL" readOnly value={state.inviteUrl} />
          <button className="chip" onClick={copyInvite} type="button">
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      )}
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
    </div>
  );
}

