import { StandaloneNewIdeaModal } from '@/components/StandaloneNewIdeaModal';
import { getCurrentTrip } from '@/lib/trips';

export default async function NewIdeaPage() {
  const trip = await getCurrentTrip();
  return <StandaloneNewIdeaModal timezone={trip?.timezone ?? 'UTC'} />;
}
