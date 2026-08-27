import Link from 'next/link';
import { NavTabs } from './NavTabs';
import { UserMenu } from './UserMenu';
import { HeaderScrollState } from './HeaderScrollState';
import { getCurrentTrip } from '@/lib/trips';
import { getSessionUser } from '@/lib/auth';
import { travelerForRole } from '@/lib/travelers';

function formatDate(date: string | null) {
  if (!date) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}

export async function Nav() {
  const [trip, user] = await Promise.all([getCurrentTrip(), getSessionUser()]);
  const dates = trip ? [formatDate(trip.startDate), formatDate(trip.endDate)].filter(Boolean).join(' – ') : null;
  const traveler = travelerForRole(trip?.role);

  return <header className="app-header"><HeaderScrollState /><div className="top"><Link className="brand" href="/" aria-label="Trip Hub home"><h1><span>Trip to:</span> {trip?.name ?? 'Trip Hub'}</h1>{trip && <div className="trip-dates">{dates || 'Dates not set'} <span aria-hidden="true">·</span> {trip.timezone}</div>}</Link>{user?.email && <UserMenu email={user.email} traveler={traveler} />}</div>{trip && user?.email && <NavTabs email={user.email} timezone={trip.timezone} traveler={traveler} />}</header>;
}
