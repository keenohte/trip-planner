'use client';

import { useActionState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { requestPasswordReset, signInWithPassword } from './actions';

export function SignInForm({ nextPath = '/' }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(signInWithPassword, { error: null });
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordReset, { error: null, sent: false });

  return (
    <div className="login-actions">
      <form className="login-form" action={action}>
        <input name="next" type="hidden" value={nextPath} />
        <label className="login-password" htmlFor="password">
          <LockKeyhole aria-hidden="true" size={20} strokeWidth={1.8} />
          <input aria-label="Password" id="password" name="password" type="password" autoComplete="current-password" placeholder="Password" required autoFocus />
        </label>
        {state.error && <p className="login-error" role="alert">{state.error}</p>}
        <button className="login-submit" disabled={pending} type="submit">
          {pending ? 'Signing in…' : 'Continue'}
        </button>
      </form>
      <form action={resetAction}>
        {resetState.sent ? <p className="login-success" role="status">Check your email for a password reset link.</p> : <>
          {resetState.error && <p className="login-error" role="alert">{resetState.error}</p>}
          <button className="login-forgot" disabled={resetPending} type="submit">{resetPending ? 'Sending…' : 'Forgot password?'}</button>
        </>}
      </form>
    </div>
  );
}
