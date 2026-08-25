# Codex Start Here — Trip Hub

## Your role

You are implementing **Trip Hub**, a lightweight collaborative travel-planning web app for two people. The repository already contains a small Next.js scaffold with mock data and basic routes. Do not redesign the product into a broad travel platform.

Read these files before making changes:

1. `PROJECT_BRIEF.md`
2. `UX_PRODUCT_SPEC.md`
3. `TECHNICAL_PLAN.md`
4. `DATA_MODEL.md`
5. `IMPLEMENTATION_PLAN.md`
6. `MIGRATION_NOTES.md`
7. Existing `README.md`
8. Existing code in `app/`, `components/`, `lib/`, and `supabase/schema.sql`

## Product in one sentence

A private, mobile-first planning space where two travelers can quickly save ideas, independently vote **Love / Interested / Pass**, automatically surface mutual picks, schedule them, and keep bookings/wishlist/notes organized without the overhead of Notion.

## Core loop

`Idea → two independent votes → Confirmed → optional date/time → Schedule`

Bookings are separate and may also appear on the Schedule when dated.

## First engineering objective

Replace mock-only behavior with a real Supabase-backed two-user flow while preserving the current lightweight UI.

### Milestone 1 — persistence + collaboration

Implement, in this order:

1. Supabase browser/server clients.
2. Environment variable setup using `.env.example`.
3. Email magic-link authentication.
4. One trip with membership support.
5. Row Level Security for every trip-scoped table.
6. Read/write Ideas from Supabase.
7. Independent user votes stored in `idea_votes`.
8. Derived Confirmed logic:
   - `manually_confirmed = true`, OR
   - both trip members have a vote of `love` or `interested`.
9. Realtime refresh/subscriptions for ideas and votes.
10. Image upload to Supabase Storage.
11. Bookings, wishlist, and notes persistence.
12. Dated Ideas + dated Bookings surfaced on Schedule.

## Important product rules

- **Confirmed is not a separate table.** It is a computed view/state of Ideas.
- **Do not expose a workflow/status field to the user.** The app should feel simpler than a database tool.
- Voting choices are only:
  - ❤️ Love
  - 👍 Interested
  - ❌ Pass
- An idea should disappear from the default Ideas view once both travelers vote positively, but remain discoverable through filters/search if we add those later.
- Flights and hotels never belong in Confirmed. They belong in Bookings.
- Restaurant reservations, event tickets, trains, experiences, etc. may be Bookings.
- Schedule is primarily a **day-by-day vertical itinerary**, with calendar as a secondary view later.
- Optimize adding and voting on Ideas for mobile usage.
- Keep Google Maps integration simple for v1: store/open map URLs. Do not build a map API integration yet.

## Do not build yet

Do not add any of the following unless explicitly requested:

- social feed or public discovery
- AI itinerary generation
- expense splitting
- native iOS/Android app
- flight-status tracking
- complex notifications
- recommendation engine
- public profiles
- full Google Maps SDK/API integration
- multi-trip dashboards beyond what is technically needed for clean data ownership

## Implementation behavior

- Prefer simple, boring code over abstractions.
- Reuse the existing route structure unless there is a strong reason not to.
- Keep components small and readable.
- Make all mutations optimistic only if rollback/error behavior is clear; correctness beats animation.
- Do not hardcode secrets.
- Do not weaken RLS for convenience.
- Preserve working UI while migrating mock data screen-by-screen.
- Run `npm run build` after meaningful changes and fix TypeScript/build errors before stopping.

## Definition of done for the first usable version

Two people can:

- sign in
- join the same trip
- add an Idea with title, location/category metadata, links, notes, and photo
- independently vote Love / Interested / Pass from the Idea card
- see mutual positive picks automatically in Confirmed
- manually confirm an Idea
- give an Idea a date/time and see it in Schedule
- create/read/update/delete Bookings
- create/read/update/delete Wishlist items
- create/read/update/delete Notes
- refresh the browser without losing data
- see the other person's changes without a manual full reload

The experience should be usable on a phone at normal mobile widths.

## When uncertain

Choose the option that makes the two-person planning loop **faster and cognitively lighter**. Avoid adding new concepts, states, or navigation destinations unless necessary.
