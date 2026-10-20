import Link from 'next/link';
import { NotebookText } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { HeaderScrollState } from './HeaderScrollState';
import { getCurrentTrip } from '@/lib/trips';
import { getSessionUser } from '@/lib/auth';

function formatDate(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

export async function Nav() {
  const [trip, user] = await Promise.all([getCurrentTrip(), getSessionUser()]);
  const dates = trip ? [formatDate(trip.startDate), formatDate(trip.endDate)].filter(Boolean).join(' – ') : null;
  return <header className="app-header"><HeaderScrollState /><div className="top"><Link className="brand" href="/schedule" aria-label="Open itinerary"><h1>{trip?.name ?? 'Trip Hub'}</h1>{trip && <div className="trip-dates">{dates || 'Dates not set'} <span aria-hidden="true">·</span> {trip.timezone}</div>}</Link>{user?.email && <div className="calendar-header-actions"><Link className="calendar-notes-link" href="/notes"><NotebookText size={16} aria-hidden="true" />Notes</Link><UserMenu email={user.email} /></div>}</div></header>;
}
