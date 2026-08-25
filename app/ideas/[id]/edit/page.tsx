import { notFound } from 'next/navigation';
import { IdeaForm } from '../../IdeaForm';
import { deleteIdea } from '../../actions';
import { getCurrentTrip } from '@/lib/trips';
import { getIdea } from '@/lib/ideas';

type EditIdeaPageProps = { params: Promise<{ id: string }> };

export default async function EditIdeaPage({ params }: EditIdeaPageProps) {
  const [{ id }, trip] = await Promise.all([params, getCurrentTrip()]);
  if (!trip) notFound();
  const idea = await getIdea(trip.id, id);
  if (!idea) notFound();
  return <><section className="hero compact-hero"><div className="eyebrow">Idea details</div><h2>Edit {idea.title}</h2><p>Keep the shared Idea useful without turning it into a database chore.</p></section><IdeaForm idea={idea} timezone={trip.timezone} /><form className="delete-form" action={deleteIdea}><input type="hidden" name="ideaId" value={idea.id} /><button className="danger-button" type="submit">Delete Idea</button></form></>;
}
