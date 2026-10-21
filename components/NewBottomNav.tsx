'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Map, NotebookText, Plus } from 'lucide-react';

type Destination = 'schedule' | 'notes' | 'map';

export function NewBottomNav({ active, addLabel, onAdd, addHref }: {
  active: Destination;
  addLabel: string;
  onAdd?: () => void;
  addHref?: string;
}) {
  const router = useRouter();
  useEffect(() => {
    router.prefetch('/schedule');
    router.prefetch('/notes');
    router.prefetch('/map');
  }, [router]);

  const destinations = [
    { key: 'schedule' as const, href: '/schedule', label: 'Schedule', Icon: CalendarDays },
    { key: 'notes' as const, href: '/notes', label: 'Notes', Icon: NotebookText },
    { key: 'map' as const, href: '/map', label: 'Map', Icon: Map },
  ];
  const addContent = <Plus size={27} strokeWidth={2.2} aria-hidden="true" />;

  return <div className="new-bottom-controls">
    <nav className="new-bottom-nav" aria-label="Primary navigation">
      {destinations.map(({ key, href, label, Icon }) => {
        const isActive = active === key;
        return <Link className={isActive ? 'is-active' : ''} href={href} prefetch aria-current={isActive ? 'page' : undefined} key={key}>
          <Icon className="new-bottom-nav__icon" size={21} strokeWidth={isActive ? 2 : 1.8} fill={isActive ? 'currentColor' : 'none'} aria-hidden="true" />
          <span>{label}</span>
        </Link>;
      })}
    </nav>
    {addHref
      ? <Link className="new-add-button" href={addHref} aria-label={addLabel}>{addContent}</Link>
      : <button className="new-add-button" type="button" aria-label={addLabel} onClick={onAdd}>{addContent}</button>}
  </div>;
}
