'use client';

import { useRef } from 'react';
import { LogOut, MoreHorizontal } from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import { useCloseDetailsOnOutside } from '@/lib/use-close-details';

export function UserMenu({ email }: { email: string }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  useCloseDetailsOnOutside(menuRef);
  return (
    <details className="user-menu" ref={menuRef}>
      <summary className="avatar-button calendar-more-button" aria-label="Open menu"><MoreHorizontal size={20} aria-hidden="true" /></summary>
      <div className="user-menu-popover">
        <div className="user-menu-email">Shared trip access<strong>{email}</strong></div>
        <form action={signOut}>
          <button className="user-menu-action" type="submit"><LogOut size={17} aria-hidden="true" />Sign out</button>
        </form>
      </div>
    </details>
  );
}
