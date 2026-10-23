type RecoveryPageProps = {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
};

export default async function RecoveryPage({ searchParams }: RecoveryPageProps) {
  const params = await searchParams;
  const tokenHash = params.token_hash ?? '';
  const type = params.type === 'recovery' ? params.type : '';
  const next = params.next?.startsWith('/') && !params.next.startsWith('//')
    ? params.next
    : '/auth/update-password';
  const valid = Boolean(tokenHash && type);

  return (
    <section className="login-screen">
      <div className="login-card">
        <img className="login-logo" src="/trip-hub-icon.svg" alt="" width="72" height="72" />
        <div className="login-heading">
          <h1>Reset password</h1>
          <p>{valid ? 'Continue to choose a new password for Trip Hub.' : 'This recovery link is incomplete or invalid.'}</p>
        </div>
        {valid ? <form className="login-form" action="/auth/confirm" method="get">
          <input name="token_hash" type="hidden" value={tokenHash} />
          <input name="type" type="hidden" value={type} />
          <input name="next" type="hidden" value={next} />
          <button className="login-submit" type="submit">Continue</button>
        </form> : <a className="login-submit login-submit--link" href="/auth/sign-in">Back to sign in</a>}
      </div>
    </section>
  );
}
