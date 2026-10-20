import { NotesBrowser } from '@/components/notes/NotesBrowser';
import { TableRealtimeRefresh } from '@/components/TableRealtimeRefresh';
import { getNotes } from '@/lib/notes';
import { getCurrentTrip } from '@/lib/trips';

const previewNotes = [
  { id: 'preview-1', title: 'Before we leave', body: 'Download offline maps, add Suica to wallet, and confirm airport transfer.', pinned: true, updatedAt: '2026-10-20T12:00:00Z' },
  { id: 'preview-2', title: 'Things to bring', body: 'Portable charger, small umbrella, passport copies, and comfortable walking shoes.', pinned: false, updatedAt: '2026-10-19T12:00:00Z' },
];

export default async function NotesPage() {
  const trip = await getCurrentTrip();
  const records = trip?.preview ? previewNotes : trip ? await getNotes(trip.id) : [];
  const notes = records.map((note) => ({ id: note.id, title: note.title, body: note.body, pinned: note.pinned, updatedAt: note.updatedAt }));
  return <>{!trip?.preview && trip && <TableRealtimeRefresh tripId={trip.id} table="notes" />}{trip ? <NotesBrowser initialNotes={notes} timezone={trip.timezone} tripStart={trip.startDate} tripEnd={trip.endDate} preview={trip.preview} /> : <section className="empty-state"><h3>No trip found</h3><p>Create a trip before adding notes.</p></section>}</>;
}
