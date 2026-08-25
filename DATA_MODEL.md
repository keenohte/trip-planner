# Trip Hub — Data Model

## Core entities

### `trips`

One collaborative trip.

Suggested fields:

- `id uuid pk`
- `name text`
- `start_date date`
- `end_date date`
- `timezone text` (recommended addition)
- `created_by uuid -> auth.users`
- `created_at timestamptz`

### `trip_members`

Membership join table.

- `trip_id uuid -> trips`
- `user_id uuid -> auth.users`
- `role text` (`owner` / `member` is enough)
- `created_at timestamptz`

Unique/primary key: `(trip_id, user_id)`.

Initial product expects two members, but the schema does not need to hard-limit it unless that materially simplifies secure invitations.

### `ideas`

The master record for brainstorming, confirmed picks, and scheduled activities.

Existing fields:

- `id`
- `trip_id`
- `title`
- `country`
- `city`
- `neighborhood`
- `types text[]`
- `notes`
- `maps_url`
- `location_address` (formatted address resolved from the Maps link)
- `website_url`
- `social_url`
- `cover_url`
- `image_url` (optional externally hosted image)
- `scheduled_at`
- `scheduled_end_at`
- `manually_confirmed`
- `created_by`
- `created_at`
- `updated_at`

No `status` column is required for the user-facing workflow.

### `idea_votes`

One vote per user per Idea.

- `idea_id`
- `user_id`
- `vote enum('love','interested','pass')`
- `updated_at` recommended

PK `(idea_id, user_id)`.

Positive vote = `love` or `interested`.

### `bookings`

Operational reservations/purchases.

- `id`
- `trip_id`
- `type`
- `title`
- `starts_at`
- `ends_at`
- `city_route`
- `provider`
- `confirmation`
- `booking_url`
- `notes`
- `created_by`
- `created_at` recommended
- `updated_at` recommended

Suggested `type` values:
- flight
- hotel
- train
- transit
- restaurant
- experience
- event
- ticket
- other

A text field with application validation is acceptable for v1; a Postgres enum is optional.

### `schedule_activities`

Lightweight custom itinerary entries that do not need the full Idea or Booking model.

- `id`
- `trip_id`
- `title`
- `country`
- `city`
- `neighborhood`
- `starts_at`
- `ends_at`
- `image_url` (optional externally hosted image)
- `cover_url` (optional private Storage path)
- `notes`
- `created_by`
- `created_at`
- `updated_at`

Trip members may collaborate on these entries. RLS prevents non-members from reading or mutating them, and the trip/creator identity fields cannot be reassigned after creation.

### `wishlist_items`

- `id`
- `trip_id`
- `title`
- `kind`
- `country`
- `city_area`
- `priority`
- `notes`
- `done`
- `created_by`
- timestamps recommended

Suggested kinds:
- buy
- eat_drink
- do
- find
- souvenir

### `notes`

- `id`
- `trip_id`
- `title`
- `body`
- `created_by`
- `created_at`
- `updated_at` recommended

## Derived concepts

### Confirmed

Not a table.

For a two-person trip:

```text
confirmed = manually_confirmed
  OR (member A positive vote AND member B positive vote)
```

Positive vote:

```sql
vote in ('love', 'interested')
```

Important edge cases:

- If only one trip member exists, their positive vote alone must not auto-confirm.
- If one person changes from positive to `pass`, automatic confirmation should disappear unless `manually_confirmed = true`.
- Manual confirmation remains until explicitly undone.

### Ideas default view

Default Ideas should contain records that are **not currently Confirmed**.

A user's `pass` does not delete the Idea.

### Schedule

Schedule is a merged presentation of:

- Mutually confirmed Ideas with `scheduled_at`
- Bookings with `starts_at`
- Custom `schedule_activities` with `starts_at`

It is also not a separate required table in v1.

## Relationships

```text
users
  └── trip_members ── trips
                       ├── ideas ── idea_votes
                       ├── bookings
                       ├── schedule_activities
                       ├── wishlist_items
                       └── notes
```

## Migration note

The existing `supabase/schema.sql` is a useful starting point, not a frozen contract. Codex should convert it into proper migration files, add timestamps/timezone as needed, and add all RLS/storage policies before treating the backend as production-ready.
