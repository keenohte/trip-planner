import Link from 'next/link';
export default function NotFound() { return <section className="empty-state"><div className="eyebrow">Page not found</div><h2>This trip page does not exist.</h2><p>Return home and continue planning.</p><Link className="primary-link" href="/">Go Home</Link></section>; }
