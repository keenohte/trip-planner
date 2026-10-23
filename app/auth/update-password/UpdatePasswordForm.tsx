'use client';

import { useActionState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { updatePassword } from './actions';

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, { error: null });

  return (
    <form className="login-form" action={action}>
      <label className="login-password" htmlFor="new-password">
        <LockKeyhole aria-hidden="true" size={20} strokeWidth={1.8} />
        <input aria-label="New password" id="new-password" name="password" type="password" autoComplete="new-password" placeholder="New password" minLength={8} required autoFocus />
      </label>
      <label className="login-password" htmlFor="confirm-password">
        <LockKeyhole aria-hidden="true" size={20} strokeWidth={1.8} />
        <input aria-label="Confirm new password" id="confirm-password" name="confirmation" type="password" autoComplete="new-password" placeholder="Confirm password" minLength={8} required />
      </label>
      {state.error && <p className="login-error" role="alert">{state.error}</p>}
      <button className="login-submit" disabled={pending} type="submit">{pending ? 'Updating…' : 'Set new password'}</button>
    </form>
  );
}
