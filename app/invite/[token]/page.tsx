import Link from 'next/link';
import { getCurrentTrip } from '@/lib/trips';
import { AcceptInviteForm } from './AcceptInviteForm';

type InvitePageProps = { params: Promise<{ token: string }> };

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const currentTrip = await getCurrentTrip();

  return (
    <section className="auth-panel">
      <div className="eyebrow">Private partner invitation</div>
      <h2>{currentTrip ? 'You already have a trip' : 'Join your shared trip'}</h2>
      {currentTrip ? (
        <>
          <p>You’re already a member of {currentTrip.name}. Trip Hub supports one active trip for now.</p>
          <Link className="primary-link" href="/">Return to your trip</Link>
        </>
      ) : (
        <>
          <p>Accept this invitation to plan together as equal trip members.</p>
          <AcceptInviteForm token={token} />
        </>
      )}
    </section>
  );
}

