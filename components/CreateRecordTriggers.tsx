'use client';

import { useState, type ReactNode } from 'react';
import { NoteForm } from '@/app/notes/NoteForm';
import { WishlistForm } from '@/app/wishlist/WishlistForm';
import { BookingModal } from '@/components/BookingModal';
import { CreateFormModal } from '@/components/CreateFormModal';

function Trigger({ className, children, render }: { className: string; children: ReactNode; render: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <><button className={className} type="button" onClick={() => setOpen(true)}>{children}</button>{open && <CreateFormModal onClose={close}>{render(close)}</CreateFormModal>}</>;
}

export function NewBookingTrigger({ timezone, className, children }: { timezone: string; className: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <><button className={className} type="button" onClick={() => setOpen(true)}>{children}</button>{open && <BookingModal timezone={timezone} onClose={() => setOpen(false)} />}</>;
}

export function NewWishlistTrigger({ className, children }: { className: string; children: ReactNode }) {
  return <Trigger className={className} render={(close) => <WishlistForm presentation="modal" onCancel={close} onSaved={close} />}>{children}</Trigger>;
}

export function NewNoteTrigger({ className, children }: { className: string; children: ReactNode }) {
  return <Trigger className={className} render={(close) => <NoteForm presentation="modal" onCancel={close} onSaved={close} />}>{children}</Trigger>;
}
