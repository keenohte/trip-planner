# Trip Hub — Technical Plan

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Supabase
  - Postgres
  - Auth
  - Storage
  - Realtime
- Vercel for hosting

Keep external dependencies minimal.

## Repository state

The current repo is a mock-data scaffold. Existing routes:

- `/`
- `/ideas`
- `/confirmed`
- `/schedule`
- `/bookings`
- `/wishlist`
- `/notes`

Existing code should be evolved rather than thrown away wholesale.

## Recommended project structure

```text
app/
  auth/
  bookings/
  confirmed/
  ideas/
  notes/
  schedule/
  wishlist/
  layout.tsx
  page.tsx

components/
  ideas/
  bookings/
  schedule/
  shared/

lib/
  supabase/
    client.ts
    server.ts
  queries/
  mutations/
  types/

supabase/
  migrations/
  seed.sql
```

Exact folders can vary; avoid architecture ceremony.

## Environment variables

Use:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

If a service-role key is ever introduced, it must remain server-only and must not be required for ordinary client operations.

## Authentication

v1: Supabase Auth email magic link / OTP.

Requirements:
- unauthenticated users cannot access trip data
- authenticated users only see trips they belong to
- support inviting/joining one partner

A simple invite mechanism is sufficient. Options:
- invite token/link
- email invitation

Choose the lowest-effort secure implementation.

## Authorization / RLS

RLS is mandatory.

General rule for trip-scoped rows:

A user may read/write a row only if they are a member of its `trip_id`.

For `idea_votes`:
- trip access is derived through the referenced Idea
- a user may only create/update/delete their own vote row
- users can read all votes for Ideas in their trips

For `trips`:
- creator/member access only

For `trip_members`:
- members can read membership in their own trips
- writes should be restricted enough to prevent users joining arbitrary private trips without a valid invitation path

Codex should implement explicit SQL policies and test them manually.

## Realtime

Realtime is valuable specifically for:
- new Ideas
- edited Ideas
- `idea_votes`

The partner's vote should appear without a full-page reload.

Do not subscribe to every table globally if a narrower trip-scoped subscription works.

## Storage

Create a Supabase Storage bucket for Idea images, e.g. `idea-images`.

Recommended path convention:

```text
{trip_id}/{idea_id}/{uuid}.{ext}
```

Requirements:
- trip members can view images for their trips
- authenticated trip members can upload
- deleting/replacing an Idea image should not leave excessive orphaned files; perfect cleanup can be deferred if necessary

For v1, one primary image per Idea is enough.

## Data fetching

Prefer Server Components for initial page data where practical.

Use Client Components for:
- vote controls
- forms
- realtime subscription handling
- local interaction state

Avoid moving the entire application client-side.

## Mutations

Use a consistent mutation strategy:
- server actions or route handlers are both acceptable
- RLS should remain the ultimate authorization boundary

Validate user input server-side before writes.

## Confirmed derivation

Do not persist a duplicate `confirmed` boolean solely for mutual votes.

Confirmed is true when:

```text
ideas.manually_confirmed = true
OR
(count of positive votes from distinct current trip members) >= required member count
```

For the initial two-person product, the expected member count is 2.

However, implement the query so it does not produce false positives when only one member currently exists in the trip.

A SQL view or application-layer query may be used. Prefer whichever is easiest to reason about and secure.

## Schedule derivation

Schedule combines two sources:

1. Ideas where `scheduled_at IS NOT NULL`
2. Bookings where `starts_at IS NOT NULL`

Normalize them in the application layer into one timeline item shape.

Suggested UI type:

```ts
type ScheduleItem = {
  id: string;
  source: 'idea' | 'booking';
  title: string;
  startsAt: string;
  endsAt?: string | null;
  type?: string | null;
  city?: string | null;
};
```

## Time zones

This requires an explicit decision before relying on production dates.

Recommended v1 approach:
- add `timezone` to Trips, or store timezone per scheduled/booked item when needed
- store absolute datetimes as `timestamptz`
- render using trip/item timezone rather than browser-local timezone alone

The initial trip spans Korea and Japan (same UTC+9), which simplifies the first use case, but the model should not permanently assume one timezone.

## Error/loading behavior

Every mutation should:
- disable duplicate submission
- surface a readable error
- preserve user input if possible

Use lightweight skeleton/loading states only where needed.

## Testing priorities

At minimum test:

1. user cannot access another trip's data
2. user cannot change partner's vote
3. two positive votes produce Confirmed
4. one positive vote does not produce Confirmed
5. manual confirm produces Confirmed
6. pass vote prevents automatic mutual-confirmed state
7. scheduled Idea appears in Schedule
8. dated Booking appears in Schedule
9. deleting Idea cascades votes
10. image upload authorization works

## Deployment

Vercel + hosted Supabase.

Before first deploy:
- env vars set in Vercel
- Supabase redirect URLs configured
- production RLS enabled
- storage policy verified
- `npm run build` passes
