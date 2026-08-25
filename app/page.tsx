import Link from 'next/link';
import { ArrowUpRight, CalendarDays, Plus } from 'lucide-react';
import { CreateInviteForm } from '@/app/invite/CreateInviteForm';
import { BookingCard } from '@/components/BookingCard';
import { IdeaPreviewCard } from '@/components/IdeaPreviewCard';
import { NewIdeaTrigger } from '@/components/NewIdeaTrigger';
import { getIdeas } from '@/lib/ideas';
import { getBookings } from '@/lib/bookings';
import { getSchedule } from '@/lib/schedule';
import { formatBookingDateTime } from '@/lib/datetime';
import { getCurrentTrip } from '@/lib/trips';

function SectionHeading({ title, description, href }: { title: string; description: string; href: string }) {
  return <div className="home-section-heading"><div><h2>{title}</h2><p>{description}</p></div><Link className="view-all-icon" href={href} aria-label={`View all ${title}`}><ArrowUpRight size={17} aria-hidden="true" /></Link></div>;
}

export default async function Home() {
  const trip = await getCurrentTrip();
  if (!trip) return <section className="hero"><h2>Plan together without the spreadsheet feeling.</h2><p>Collect ideas, choose your favorites, and turn them into a shared itinerary.</p></section>;

  const [ideas, bookings, schedule] = await Promise.all([
    getIdeas(trip.id),
    getBookings(trip.id, trip.timezone),
    getSchedule(trip),
  ]);
  const openIdeas = ideas.filter((idea) => !idea.isConfirmed).slice(0, 3);
  const confirmed = ideas.filter((idea) => idea.isConfirmed).slice(0, 4);

  return <div className="home-dashboard"><section className="home-section"><SectionHeading title="Ideas" description="Share possibilities and find the things you both love." href="/ideas" /><div className="home-card-grid"><NewIdeaTrigger className="home-create-card" timezone={trip.timezone}><span><Plus size={28} aria-hidden="true" /></span><strong>Create new idea</strong><small>Add a place, activity, or meal</small></NewIdeaTrigger>{openIdeas.map((idea) => <IdeaPreviewCard idea={idea} timezone={trip.timezone} key={idea.id} />)}</div>{openIdeas.length === 0 && <p className="home-inline-empty">No open ideas yet. Start with something you would be excited to do.</p>}</section><section className="home-section"><SectionHeading title="Confirmed" description="The ideas you are both interested in." href="/confirmed" />{confirmed.length > 0 ? <div className="home-card-grid">{confirmed.map((idea) => <IdeaPreviewCard idea={idea} timezone={trip.timezone} key={idea.id} />)}</div> : <div className="home-empty-surface">Mutual favorites will appear here once you both tap Interested.</div>}</section><section className="home-section"><SectionHeading title="Schedule" description="A quick look at what is coming up." href="/schedule" />{schedule.length > 0 ? <div className="home-schedule-surface">{schedule.slice(0, 3).map((group) => <div className="home-schedule-day" key={group.key}><div><CalendarDays size={18} aria-hidden="true" /><strong>{new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: group.timezone }).format(new Date(group.startsAt))}</strong></div><div>{group.items.slice(0, 3).map((item) => <Link href={item.href} key={`${item.source}-${item.id}`}><span>{formatBookingDateTime(item.startsAt, item.timezone)}</span><strong>{item.title}</strong></Link>)}</div></div>)}</div> : <div className="home-empty-surface">Your day-by-day plan will take shape here as dates are added.</div>}</section><section className="home-section"><SectionHeading title="Bookings" description="Travel details and confirmation numbers in one place." href="/bookings" />{bookings.length > 0 ? <div className="home-card-grid">{bookings.slice(0, 4).map((booking) => <BookingCard booking={booking} key={booking.id} />)}</div> : <div className="home-empty-surface">Add flights, stays, trains, and reservations when you are ready.</div>}</section><CreateInviteForm tripId={trip.id} /></div>;
}
