import { SignInForm } from './SignInForm';

type SignInPageProps = {
  searchParams: Promise<{ error?: string; next?: string; reason?: string }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next?.startsWith('/') && !params.next.startsWith('//') ? params.next : '/';

  return (
    <section className="login-screen">
      <div className="login-card">
        <img className="login-logo" src="/trip-hub-icon.svg" alt="" width="72" height="72" />
        <div className="login-heading"><h1>Trip Hub</h1><p>Your trip, all in one place.</p></div>
        {params.error && <p className="login-error" role="alert">{params.error}</p>}
        <SignInForm nextPath={nextPath} />
      </div>
    </section>
  );
}

