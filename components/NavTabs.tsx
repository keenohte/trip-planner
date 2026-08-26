'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Heart, Lightbulb, NotebookText, Plus, ShoppingBag, Tickets } from 'lucide-react';
import { UserMenu } from './UserMenu';
import { NewIdeaTrigger } from './NewIdeaTrigger';
import type { Traveler } from '@/lib/travelers';

const tabs = [
  ['/ideas', 'Ideas', Lightbulb],
  ['/confirmed', 'Confirmed', Heart],
  ['/schedule', 'Schedule', CalendarDays],
  ['/bookings', 'Bookings', Tickets],
  ['/wishlist', 'Wishlist', ShoppingBag],
  ['/notes', 'Notes', NotebookText],
] as const;

function active(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

export function NavTabs({ email, timezone, traveler }: { email: string; timezone: string; traveler: Traveler }) {
  const pathname = usePathname();
  return <><nav className="tabs desktop-tabs" aria-label="Trip sections">{tabs.map(([href, label, Icon]) => <Link className={`tab${active(pathname, href) ? ' active' : ''}`} aria-current={active(pathname, href) ? 'page' : undefined} key={href} href={href}><Icon size={23} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span></Link>)}</nav><nav className="mobile-tabs" aria-label="Trip shortcuts"><Link className={`mobile-tab${active(pathname, '/schedule') ? ' active' : ''}`} aria-label="Schedule" aria-current={active(pathname, '/schedule') ? 'page' : undefined} href="/schedule"><CalendarDays size={20} aria-hidden="true" /></Link><NewIdeaTrigger className="mobile-tab mobile-tab-create" timezone={timezone}><Plus size={23} aria-hidden="true" /><span className="sr-only">New idea</span></NewIdeaTrigger><UserMenu email={email} traveler={traveler} placement="mobile" /></nav></>;
}
