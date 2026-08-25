'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { LogOut, UserRound } from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import { useCloseDetailsOnOutside } from '@/lib/use-close-details';

const menuLinks = [
  ['/', 'Home'],
  ['/ideas', 'Ideas'],
  ['/confirmed', 'Confirmed'],
  ['/bookings', 'Bookings'],
  ['/wishlist', 'Wishlist'],
  ['/notes', 'Notes'],
] as const;

export function UserMenu({ email, placement = 'desktop' }: { email: string; placement?: 'desktop' | 'mobile' }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useCloseDetailsOnOutside(menuRef);
  return (
    <details className={`user-menu user-menu-${placement}`} ref={menuRef}>
      <summary className="avatar-button" aria-label="Open account menu">
        <span className="avatar-fpo" aria-hidden="true"><UserRound size={placement === 'mobile' ? 22 : 19} strokeWidth={2} /></span>
      </summary>
      <div className="user-menu-popover">
        <div className="user-menu-email">Signed in as<strong>{email}</strong></div>
        {placement === 'mobile' && <nav className="user-menu-links" aria-label="More trip sections">
          {menuLinks.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}
        </nav>}
        <form action={signOut}>
          <button className="user-menu-action" type="submit"><LogOut size={17} aria-hidden="true" />Sign out</button>
        </form>
      </div>
    </details>
  );
}
