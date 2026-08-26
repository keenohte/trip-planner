'use client';

import { FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Field, Input } from '@/components/ui/FormControls';

export function SignInForm({ nextPath = '/' }: { nextPath?: string }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const supabase = createClient();
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', nextPath);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callback.toString() },
    });

    setIsSubmitting(false);
    setMessage(error ? error.message : 'Check your email for a secure sign-in link.');
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <Field htmlFor="email" label="Email address" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
        />
      </Field>
      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Sending link…' : 'Email me a sign-in link'}
      </button>
      {message && <p className="form-message" role="status">{message}</p>}
    </form>
  );
}
