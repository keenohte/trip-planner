import { createClient } from '@/lib/supabase/server';
import { getSessionUser } from '@/lib/auth';
import { travelerForRole, type Traveler } from '@/lib/travelers';

export type VoteValue = 'love' | 'interested' | 'pass';

export type Idea = {
  id: string;
  tripId: string;
  title: string;
  country: string | null;
  city: string | null;
  neighborhood: string | null;
  types: string[];
  notes: string | null;
  mapsUrl: string | null;
  locationAddress: string | null;
  websiteUrl: string | null;
  socialUrl: string | null;
  coverPath: string | null;
  externalImageUrl: string | null;
  imageUrl: string | null;
  createdBy: string;
  createdAt: string;
  scheduledAt: string | null;
  scheduledEndAt: string | null;
  addedByMe: boolean;
  viewerId: string;
  viewerTraveler: Traveler;
  currentVote: VoteValue | null;
  partnerVote: VoteValue | null;
  isConfirmed: boolean;
};

type IdeaVoteRow = { user_id: string; vote: VoteValue };

type IdeaRow = {
  id: string;
  trip_id: string;
  title: string;
  country: string | null;
  city: string | null;
  neighborhood: string | null;
  types: string[] | null;
  notes: string | null;
  maps_url: string | null;
  location_address: string | null;
  website_url: string | null;
  social_url: string | null;
  cover_url: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  scheduled_at: string | null;
  scheduled_end_at: string | null;
  idea_votes: IdeaVoteRow[] | null;
};

export function isPositiveVote(vote: VoteValue | null) {
  return vote === 'interested';
}

type TripMemberRow = { user_id: string; role: 'owner' | 'member' };

function mapIdea(row: IdeaRow, userId: string, members: TripMemberRow[], imageUrl: string | null): Idea {
  const votes = row.idea_votes ?? [];
  const memberIds = members.map((member) => member.user_id);
  const currentVote = votes.find((vote) => vote.user_id === userId)?.vote ?? null;
  const partnerId = memberIds.find((memberId) => memberId !== userId);
  const partnerVote = partnerId ? votes.find((vote) => vote.user_id === partnerId)?.vote ?? null : null;
  const mutuallyPositive = memberIds.length === 2 && memberIds.every((memberId) =>
    isPositiveVote(votes.find((vote) => vote.user_id === memberId)?.vote ?? null),
  );
  return {
    id: row.id,
    tripId: row.trip_id,
    title: row.title,
    country: row.country,
    city: row.city,
    neighborhood: row.neighborhood,
    types: row.types ?? [],
    notes: row.notes,
    mapsUrl: row.maps_url,
    locationAddress: row.location_address,
    websiteUrl: row.website_url,
    socialUrl: row.social_url,
    coverPath: row.cover_url,
    externalImageUrl: row.image_url,
    imageUrl: row.image_url ?? imageUrl,
    createdBy: row.created_by,
    createdAt: row.created_at,
    scheduledAt: row.scheduled_at,
    scheduledEndAt: row.scheduled_end_at,
    addedByMe: row.created_by === userId,
    viewerId: userId,
    viewerTraveler: travelerForRole(members.find((member) => member.user_id === userId)?.role),
    currentVote,
    partnerVote,
    isConfirmed: mutuallyPositive,
  };
}

async function signedImageUrls(paths: string[]) {
  if (paths.length === 0) return new Map<string, string>();
  const supabase = await createClient();
  const { data } = await supabase.storage.from('idea-images').createSignedUrls(paths, 3600);
  return new Map(
    (data ?? [])
      .filter((item) => item.signedUrl)
      .map((item) => [item.path, item.signedUrl]),
  );
}

export async function getIdeas(tripId: string): Promise<Idea[]> {
  const supabase = await createClient();
  const [authUser, { data, error }, { data: members }] = await Promise.all([
    getSessionUser(),
    supabase
      .from('ideas')
      .select('id, trip_id, title, country, city, neighborhood, types, notes, maps_url, location_address, website_url, social_url, cover_url, image_url, scheduled_at, scheduled_end_at, created_by, created_at, idea_votes(user_id, vote)')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false }),
    supabase.from('trip_members').select('user_id, role').eq('trip_id', tripId).order('created_at'),
  ]);
  if (error || !authUser) return [];

  const rows = (data ?? []) as IdeaRow[];
  const imageUrls = await signedImageUrls(rows.flatMap((row) => (row.cover_url ? [row.cover_url] : [])));
  return rows.map((row) => mapIdea(row, authUser.id, (members ?? []) as TripMemberRow[], row.cover_url ? imageUrls.get(row.cover_url) ?? null : null));
}

export async function getIdea(tripId: string, ideaId: string): Promise<Idea | null> {
  const supabase = await createClient();
  const [authUser, { data, error }, { data: members }] = await Promise.all([
    getSessionUser(),
    supabase
      .from('ideas')
      .select('id, trip_id, title, country, city, neighborhood, types, notes, maps_url, location_address, website_url, social_url, cover_url, image_url, scheduled_at, scheduled_end_at, created_by, created_at, idea_votes(user_id, vote)')
      .eq('trip_id', tripId)
      .eq('id', ideaId)
      .maybeSingle(),
    supabase.from('trip_members').select('user_id, role').eq('trip_id', tripId).order('created_at'),
  ]);
  if (error || !data || !authUser) return null;

  const row = data as IdeaRow;
  const imageUrls = await signedImageUrls(row.cover_url ? [row.cover_url] : []);
  return mapIdea(row, authUser.id, (members ?? []) as TripMemberRow[], row.cover_url ? imageUrls.get(row.cover_url) ?? null : null);
}

export async function getIdeaCount(tripId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('ideas')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId);
  return count ?? 0;
}

export async function getIdeaCounts(tripId: string) {
  const ideas = await getIdeas(tripId);
  const confirmed = ideas.filter((idea) => idea.isConfirmed).length;
  return { total: ideas.length, confirmed, open: ideas.length - confirmed };
}
