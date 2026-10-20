'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, NotebookText, Pin, Plus } from 'lucide-react';
import { deleteNoteFromDrawer, toggleNotePinned } from '@/app/notes/actions';
import { SwipeReveal } from '@/components/calendar/SwipeReveal';
import { NoteDrawer, type NoteItem, type PreviewNoteInput } from '@/components/notes/NoteDrawer';

function formatTripDate(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`));
}

export function NotesBrowser({ initialNotes, timezone, tripStart, tripEnd, preview = false }: {
  initialNotes: NoteItem[];
  timezone: string;
  tripStart: string | null;
  tripEnd: string | null;
  preview?: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [selected, setSelected] = useState<NoteItem | null | undefined>(undefined);
  const [, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => setNotes(initialNotes), [initialNotes]);

  const savePreview = ({ note, title, body }: PreviewNoteInput) => {
    if (note) setNotes((items) => items.map((item) => item.id === note.id ? { ...item, title, body: body || null, updatedAt: new Date().toISOString() } : item));
    else setNotes((items) => [{ id: `preview-${Date.now()}`, title, body: body || null, pinned: false, updatedAt: new Date().toISOString() }, ...items]);
  };

  const remove = async (note: NoteItem) => {
    const previous = notes;
    setNotes((items) => items.filter((item) => item.id !== note.id));
    if (preview) return;
    const data = new FormData(); data.set('noteId', note.id);
    const result = await deleteNoteFromDrawer(data);
    if (result.error) setNotes(previous);
    else startTransition(() => router.refresh());
  };

  const togglePin = async (note: NoteItem) => {
    const previous = notes;
    const pinned = !note.pinned;
    setNotes((items) => items.map((item) => item.id === note.id ? { ...item, pinned } : item));
    if (preview) return;
    const data = new FormData(); data.set('noteId', note.id); data.set('pinned', String(pinned));
    const result = await toggleNotePinned(data);
    if (result.error) setNotes(previous);
    else startTransition(() => router.refresh());
  };

  const noteCard = (note: NoteItem) => <SwipeReveal
    key={note.id}
    label={note.title}
    onDelete={() => remove(note)}
    secondaryAction={{ label: note.pinned ? 'Unpin' : 'Pin', active: note.pinned, icon: <Pin size={19} fill="currentColor" />, onAction: () => togglePin(note) }}
  >
    <button className="new-note-card" type="button" onClick={() => setSelected(note)}>
      <h3>{note.title}</h3>
      <p>{note.body || 'Empty note'}</p>
      <small>Updated {new Intl.DateTimeFormat('en-US', { timeZone: timezone, month: 'short', day: 'numeric' }).format(new Date(note.updatedAt))}</small>
    </button>
  </SwipeReveal>;

  const pinned = notes.filter((note) => note.pinned);
  const unpinned = notes.filter((note) => !note.pinned);
  const dateRange = tripStart && tripEnd ? `${formatTripDate(tripStart)} – ${formatTripDate(tripEnd)}` : 'Trip dates';

  return <div className="new-app new-notes-page">
    <header className="new-app-header"><p className="new-trip-range">{dateRange}{preview && <span className="new-preview-label">Preview</span>}</p><h1>Your trip notes</h1></header>
    {pinned.length > 0 && <section className="new-notes-section"><h2>Pinned</h2><div className="new-notes-list">{pinned.map(noteCard)}</div></section>}
    <section className="new-notes-section"><h2>All notes</h2><div className="new-notes-list">{unpinned.length ? unpinned.map(noteCard) : <p className="new-notes-empty">No other notes yet.</p>}</div></section>
    <nav className="new-bottom-nav" aria-label="Primary navigation"><Link href="/schedule"><CalendarDays size={20} /><span>Schedule</span></Link><span className="new-bottom-nav__item is-active"><NotebookText size={20} /><span>Notes</span></span><button className="new-add-button" type="button" aria-label="Add note" onClick={() => setSelected(null)}><Plus size={25} /></button></nav>
    {selected !== undefined && <NoteDrawer key={selected?.id ?? 'new'} note={selected} preview={preview} onPreviewSave={savePreview} onClose={() => setSelected(undefined)} />}
  </div>;
}
