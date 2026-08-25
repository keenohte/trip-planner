import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getNote } from '@/lib/notes';
import { getCurrentTrip } from '@/lib/trips';

type Props = { params: Promise<{ id: string }> };
export default async function NoteDetailPage({ params }: Props) {
  const [{ id }, trip] = await Promise.all([params, getCurrentTrip()]);
  if (!trip) notFound();
  const note = await getNote(trip.id, id);
  if (!note) notFound();
  return <><div className="detail-toolbar"><Link className="secondary-link" href="/notes">← All Notes</Link><Link className="primary-link" href={`/notes/${note.id}/edit`}>Edit Note</Link></div><article className="note-detail"><div className="idea-kicker">Shared Note</div><h2>{note.title}</h2><div className="note-body">{note.body || 'This Note is empty.'}</div></article></>;
}
