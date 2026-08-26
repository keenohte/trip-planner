'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { voteState, voteLabel } from '@/lib/vote-state';
import type { VoteValue } from '@/lib/ideas';
import { TravelerAvatar } from '@/components/ui/TravelerAvatar';
import type { Traveler } from '@/lib/travelers';

type VoteControlsProps = {
  ideaId: string;
  viewerId: string;
  viewerTraveler: Traveler;
  currentVote: VoteValue | null;
  partnerVote: VoteValue | null;
  /** Show both traveler avatars for a mutual pick. Off in dense grids. */
  showMutual?: boolean;
};

export function VoteControls({ ideaId, viewerId, viewerTraveler, currentVote, partnerVote, showMutual = true }: VoteControlsProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(currentVote !== null && currentVote !== 'pass');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLiked(currentVote !== null && currentVote !== 'pass');
  }, [currentVote]);

  const state = voteState(liked ? 'interested' : null, partnerVote);

  async function toggleInterest() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: voteError } = liked
      ? await supabase.from('idea_votes').delete().eq('idea_id', ideaId).eq('user_id', viewerId)
      : await supabase
          .from('idea_votes')
          .upsert({ idea_id: ideaId, user_id: viewerId, vote: 'interested' }, { onConflict: 'idea_id,user_id' });

    if (voteError) {
      setError('Your choice could not be saved. Please try again.');
    } else {
      setLiked(!liked);
      router.refresh();
    }
    setPending(false);
  }

  return (
    <div className="vote" onClick={(event) => event.stopPropagation()}>
      {state === 'mutual' && showMutual && (
        <span className="vote__avatars" title={voteLabel.mutual}>
          <TravelerAvatar traveler="male" />
          <TravelerAvatar traveler="female" />
          <span className="sr-only">{voteLabel.mutual}</span>
        </span>
      )}

      {state === 'theirs' && (
        <span title={voteLabel.theirs}>
          <TravelerAvatar traveler={viewerTraveler === 'male' ? 'female' : 'male'} />
          <span className="sr-only">{voteLabel.theirs}</span>
        </span>
      )}

      <button
        className="vote__heart"
        type="button"
        aria-pressed={liked}
        aria-label={liked ? 'Remove your like' : 'Like this idea'}
        disabled={pending}
        onClick={toggleInterest}
      >
        <Heart size={21} fill={liked ? 'currentColor' : 'none'} strokeWidth={2} aria-hidden="true" />
      </button>

      {error && <p className="vote__error" role="alert">{error}</p>}
    </div>
  );
}
