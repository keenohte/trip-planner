'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole } from 'lucide-react';
import { requestPasswordReset, resetPasswordWithCode, signInWithPassword } from './actions';

export function SignInForm({ nextPath = '/' }: { nextPath?: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(signInWithPassword, { error: null, signedIn: false });
  const [resetState, resetAction, resetPending] = useActionState(requestPasswordReset, { error: null, sent: false });
  const [codeState, codeAction, codePending] = useActionState(resetPasswordWithCode, { error: null });

  useEffect(() => {
    if (!state.signedIn) return;
    router.replace(nextPath);
    router.refresh();
  }, [nextPath, router, state.signedIn]);

  return (
    <div className="login-actions">
      <form className="login-form" action={action}>
        <label className="login-password" htmlFor="password">
          <LockKeyhole aria-hidden="true" size={20} strokeWidth={1.8} />
          <input aria-label="Password" id="password" name="password" type="password" autoComplete="current-password" placeholder="Password" required autoFocus />
        </label>
        {state.error && <p className="login-error" role="alert">{state.error}</p>}
        <button className="login-submit" disabled={pending} type="submit">
          {pending ? 'Signing in…' : 'Continue'}
        </button>
      </form>
      {resetState.sent ? <div className="login-recovery">
        <p className="login-success" role="status">Check your email for the Trip Hub recovery code.</p>
        <form className="login-form" action={codeAction}>
          <label className="login-password" htmlFor="recovery-code">
            <input aria-label="Recovery code" id="recovery-code" name="code" inputMode="numeric" autoComplete="one-time-code" placeholder="Recovery code" required />
          </label>
          <label className="login-password" htmlFor="recovery-password">
            <LockKeyhole aria-hidden="true" size={20} strokeWidth={1.8} />
            <input aria-label="New password" id="recovery-password" name="password" type="password" autoComplete="new-password" placeholder="New password" minLength={8} required />
          </label>
          <label className="login-password" htmlFor="recovery-confirmation">
            <LockKeyhole aria-hidden="true" size={20} strokeWidth={1.8} />
            <input aria-label="Confirm new password" id="recovery-confirmation" name="confirmation" type="password" autoComplete="new-password" placeholder="Confirm password" minLength={8} required />
          </label>
          {codeState.error && <p className="login-error" role="alert">{codeState.error}</p>}
          <button className="login-submit" disabled={codePending} type="submit">{codePending ? 'Updating…' : 'Set new password'}</button>
        </form>
      </div> : <form action={resetAction}>
        <>
          {resetState.error && <p className="login-error" role="alert">{resetState.error}</p>}
          <button className="login-forgot" disabled={resetPending} type="submit">{resetPending ? 'Sending…' : 'Forgot password?'}</button>
        </>
      </form>}
    </div>
  );
}
