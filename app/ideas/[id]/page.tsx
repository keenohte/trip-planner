import { notFound } from 'next/navigation';
import { StandaloneIdeaModal } from '@/components/StandaloneIdeaModal';
import { getCurrentTrip } from '@/lib/trips';
import { getIdea } from '@/lib/ideas';

type IdeaDetailPageProps = { params: Promise<{ id: string }> };

export default async function IdeaDetailPage({ params }: IdeaDetailPageProps) {
  const [{ id }, trip] = await Promise.all([params, getCurrentTrip()]);
  if (!trip) notFound();
  const idea = await getIdea(trip.id, id);
  if (!idea) notFound();
  return <StandaloneIdeaModal idea={idea} timezone={trip.timezone} />;
}
