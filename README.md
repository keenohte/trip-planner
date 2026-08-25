# Trip Hub v0

A deliberately small collaborative travel planner for two people.

## Core flow

1. **Ideas** — dump restaurants, shops, sights, neighborhoods and experiences.
2. Each traveler votes **Love / Interested / Pass**.
3. If both votes are positive, the idea automatically appears in **Confirmed**.
4. Add a date/time and it appears in **Schedule**.
5. Flights, hotels, trains, reservations and tickets live in **Bookings**.
6. **Wishlist** is for things to buy/find/try, and **Notes** is the trip notebook.

## Date and timezone behavior

Idea schedule fields are entered in the trip timezone and stored by Supabase as absolute UTC timestamps (`timestamptz`). The Schedule converts those timestamps back into the trip timezone for day grouping and display, rather than using the browser's timezone. Bookings default to the trip timezone but can provide an item-specific timezone for routes or reservations elsewhere.

## Current milestone

The repository now includes the Milestone 1 Supabase foundation: SSR-compatible
clients, email magic-link authentication, a protected app shell, migration-managed
tables, and membership-based Row Level Security. Product screens still use mock
data until the later persistence milestones.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Supabase setup

1. Copy `.env.example` to `.env.local` and add the project URL and anon key.
2. Apply `supabase/migrations/202608240001_supabase_foundation.sql` with
   `supabase db push` or in the hosted Supabase SQL editor.
3. In Supabase Auth URL Configuration, set the Site URL to the app origin and add
   `http://localhost:3000/auth/callback` as a local redirect URL. Add the matching
   production callback URL before deployment.
4. Keep email signups enabled for magic-link authentication.

The migration enables RLS on every trip-scoped table. Anonymous requests have no
policies, trip data is membership-scoped, membership writes are closed until the
secure invite flow in Milestone 2, and users can only write their own Idea vote.
The `idea-images` bucket is private and uses the same membership boundary.

With a local Supabase stack running, verify the policies with:

```bash
supabase test db supabase/tests/rls.sql
```

## Product constraint

Do not add social feeds, AI itinerary generation, expense splitting, native apps, flight tracking or complex notifications until the two-person planning loop feels excellent.

## Codex handoff

If continuing this project with Codex, begin with [`CODEX_START_HERE.md`](./CODEX_START_HERE.md). It links to the full product, UX, architecture, data-model, implementation, and migration context.
