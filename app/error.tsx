'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="empty-state error-state"><div className="eyebrow">Something went wrong</div><h2>Trip Hub could not load this page.</h2><p>Your saved trip data is still in Supabase. Try loading the page again.</p><button className="primary-button" type="button" onClick={reset}>Try again</button></section>;
}
