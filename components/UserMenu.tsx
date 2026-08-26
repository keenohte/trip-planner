'use client';

import { useRef } from 'react';
import { LogOut } from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import { useCloseDetailsOnOutside } from '@/lib/use-close-details';
import { TravelerAvatar } from '@/components/ui/TravelerAvatar';
import type { Traveler } from '@/lib/travelers';

export function UserMenu({ email, traveler, placement = 'desktop' }: { email: string; traveler: Traveler; placement?: 'desktop' | 'mobile' }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useCloseDetailsOnOutside(menuRef);
  return (
    <details className={`user-menu user-menu-${placement}`} ref={menuRef}>
      <summary className="avatar-button" aria-label="Open account menu">
        <TravelerAvatar traveler={traveler} size="profile" />
      </summary>
      <div className="user-menu-popover">
        {placement === 'desktop' && <div className="user-menu-email">Signed in as<strong>{email}</strong></div>}
        <form action={signOut}>
          <button className="user-menu-action" type="submit"><LogOut size={17} aria-hidden="true" />Sign out</button>
        </form>
      </div>
    </details>
  );
}
