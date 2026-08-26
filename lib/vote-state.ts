import type { VoteValue } from '@/lib/ideas';

/* The UI writes only 'interested' today (the heart is a toggle), but the
   column allows 'love' | 'interested' | 'pass'. Treat anything non-pass as
   positive so this keeps working if Love and Pass get wired up later. */
const positive = (v: VoteValue | null) => v !== null && v !== 'pass';

export type VoteState = 'none' | 'yours' | 'theirs' | 'mutual';

export function voteState(currentVote: VoteValue | null, partnerVote: VoteValue | null): VoteState {
  const you = positive(currentVote);
  const them = positive(partnerVote);
  if (you && them) return 'mutual';
  if (you) return 'yours';
  if (them) return 'theirs';
  return 'none';
}

export const voteLabel: Record<VoteState, string> = {
  none: '',
  yours: 'You like this',
  theirs: 'They like this',
  mutual: 'You both like this',
};
