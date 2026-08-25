'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { VoteValue } from '@/lib/ideas';
import { Heart, UserRound } from 'lucide-react';

type VoteControlsProps = {
  ideaId: string;
  viewerId: string;
  currentVote: VoteValue | null;
  partnerVote: VoteValue | null;
};

export function VoteControls({ ideaId, viewerId, currentVote, partnerVote }: VoteControlsProps) {
  const router = useRouter();
  const [isInterested, setIsInterested] = useState(currentVote === 'interested');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsInterested(currentVote === 'interested');
  }, [currentVote]);

  async function toggleInterest() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: voteError } = isInterested
      ? await supabase.from('idea_votes').delete().eq('idea_id', ideaId).eq('user_id', viewerId)
      : await supabase
          .from('idea_votes')
          .upsert({ idea_id: ideaId, user_id: viewerId, vote: 'interested' }, { onConflict: 'idea_id,user_id' });

    if (voteError) {
      setError('Your choice could not be saved. Please try again.');
    } else {
      setIsInterested(!isInterested);
      router.refresh();
    }
    setPending(false);
  }

  return (
    <div className="card-vote-controls" onClick={(event) => event.stopPropagation()}>
      {partnerVote === 'interested' && <div className={`vote-avatars${isInterested ? ' confirmed' : ''}`} aria-label={isInterested ? 'Both travelers like this idea' : 'Your partner likes this idea'}>
        {isInterested && <span className="vote-avatar vote-avatar-me"><UserRound size={13} aria-hidden="true" /></span>}
        <span className="vote-avatar vote-avatar-partner"><UserRound size={13} aria-hidden="true" /></span>
      </div>}
      <button
        className={`heart-button${isInterested ? ' active' : ''}`}
        type="button"
        aria-pressed={isInterested}
        aria-label={isInterested ? 'Unlike idea' : 'Like idea'}
        disabled={pending}
        onClick={toggleInterest}
      >
        <Heart size={21} fill={isInterested ? 'currentColor' : 'none'} strokeWidth={2} aria-hidden="true" />
      </button>
      {error && <p className="vote-error" role="alert">{error}</p>}
    </div>
  );
}
