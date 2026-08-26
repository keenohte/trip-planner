'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, UserRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { voteState, voteLabel } from '@/lib/vote-state';
import type { VoteValue } from '@/lib/ideas';

type VoteControlsProps = {
  ideaId: string;
  viewerId: string;
  currentVote: VoteValue | null;
  partnerVote: VoteValue | null;
  /** Show both traveler avatars for a mutual pick. Off in dense grids. */
  showMutual?: boolean;
};

export function VoteControls({ ideaId, viewerId, currentVote, partnerVote, showMutual = true }: VoteControlsProps) {
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
          <span className="vote__avatar vote__avatar--you">
            <UserRound size={13} aria-hidden="true" />
          </span>
          <span className="vote__avatar">
            <UserRound size={13} aria-hidden="true" />
          </span>
          <span className="sr-only">{voteLabel.mutual}</span>
        </span>
      )}

      {state === 'theirs' && (
        <span className="vote__avatar" title={voteLabel.theirs}>
          <UserRound size={13} aria-hidden="true" />
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
