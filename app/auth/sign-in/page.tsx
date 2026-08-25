import { isSupabaseConfigured } from '@/lib/supabase/env';
import { SignInForm } from './SignInForm';

type SignInPageProps = {
  searchParams: Promise<{ error?: string; next?: string; reason?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next?.startsWith('/') && !params.next.startsWith('//') ? params.next : '/';

  return (
    <section className="auth-panel">
      <div className="eyebrow">Private trip workspace</div>
      <h2>Sign in to Trip Hub</h2>
      <p>We’ll email you a magic link—no password to remember.</p>
      {params.error && <p className="auth-error" role="alert">{params.error}</p>}
      {!isSupabaseConfigured ? (
        <div className="auth-error" role="alert">
          Supabase is not configured yet. Copy <code>.env.example</code> to{' '}
          <code>.env.local</code>, add the project URL and anon key, then restart the app.
        </div>
      ) : (
        <SignInForm nextPath={nextPath} />
      )}
    </section>
  );
}

