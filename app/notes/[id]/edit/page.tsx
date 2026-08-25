import { notFound } from 'next/navigation';
import { NoteForm } from '../../NoteForm';
import { deleteNote } from '../../actions';
import { getNote } from '@/lib/notes';
import { getCurrentTrip } from '@/lib/trips';

type Props = { params: Promise<{ id: string }> };
export default async function EditNotePage({ params }: Props) {
  const [{ id }, trip] = await Promise.all([params, getCurrentTrip()]);
  if (!trip) notFound();
  const note = await getNote(trip.id, id);
  if (!note) notFound();
  return <><section className="hero compact-hero"><div className="eyebrow">Shared Note</div><h2>Edit {note.title}</h2><p>Changes are visible to both travelers.</p></section><NoteForm note={note} /><form className="delete-form" action={deleteNote}><input type="hidden" name="noteId" value={note.id} /><button className="danger-button" type="submit">Delete Note</button></form></>;
}
