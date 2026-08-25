import { redirect } from 'next/navigation';
import { getCurrentTrip } from '@/lib/trips';
import { CreateTripForm } from './CreateTripForm';

export default async function OnboardingPage() {
  const currentTrip = await getCurrentTrip();
  if (currentTrip) redirect('/');

  return (
    <section className="auth-panel">
      <div className="eyebrow">One shared trip</div>
      <h2>Create your trip</h2>
      <p>Start the private planning space, then send one secure invite to your travel partner.</p>
      <CreateTripForm />
    </section>
  );
}

