import Link from 'next/link';
import { TableRealtimeRefresh } from '@/components/TableRealtimeRefresh';
import { NewNoteTrigger } from '@/components/CreateRecordTriggers';
import { getNotes } from '@/lib/notes';
import { getCurrentTrip } from '@/lib/trips';

export default async function NotesPage() {
  const trip = await getCurrentTrip();
  const notes = trip ? await getNotes(trip.id) : [];
  return <>{trip && <TableRealtimeRefresh tripId={trip.id} table="notes" />}<div className="simple-page-toolbar"><div><h2>Notes</h2><p>Shared details and reminders.</p></div><NewNoteTrigger className="primary-link">+ Add Note</NewNoteTrigger></div>{notes.length > 0 ? <div className="notes-grid">{notes.map((note) => <Link className="note-card" href={`/notes/${note.id}`} key={note.id}><h3>{note.title}</h3><p>{note.body || 'Empty Note'}</p><small>Updated {new Intl.DateTimeFormat('en-US', { timeZone: trip?.timezone ?? 'UTC', month: 'short', day: 'numeric' }).format(new Date(note.updatedAt))}</small></Link>)}</div> : <section className="empty-state"><h3>No shared notes yet</h3><p>Plain text keeps trip knowledge quick to write and easy to find.</p><NewNoteTrigger className="primary-link">Add your first Note</NewNoteTrigger></section>}</>;
}
