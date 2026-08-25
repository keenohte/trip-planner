# Trip Hub — Implementation Plan

## Guiding rule

Build the narrowest fully-working collaborative loop before visual polish or secondary features.

## Milestone 0 — repo health

Goal: understand and stabilize the existing scaffold.

Tasks:
- run `npm install`
- run current app
- inspect all routes/components/mock data
- run `npm run build`
- fix any pre-existing build errors
- add `.env.example`

Definition of done:
- app runs locally
- build passes
- no product behavior changed unnecessarily

## Milestone 1 — Supabase foundation

Goal: secure authenticated persistence.

Tasks:
- create Supabase client/server helpers
- convert `supabase/schema.sql` into migrations
- add missing timestamps/timezone fields where appropriate
- enable RLS on all tables
- write membership-based policies
- configure magic-link auth
- add auth callback route if needed
- add basic sign-in/sign-out UI

Definition of done:
- authenticated user session works
- unauthenticated data access fails
- cross-trip data access fails

## Milestone 2 — trip membership

Goal: two people share one trip.

Tasks:
- create/select current trip
- ensure creator becomes member
- implement simple secure invite/join flow
- current trip context available throughout app

Definition of done:
- two separate user accounts can access the same trip
- a third unrelated account cannot

## Milestone 3 — Ideas CRUD

Goal: replace mock Ideas with database-backed data.

Tasks:
- list Ideas
- create Idea
- edit Idea
- delete Idea
- upload/replace primary image
- open Maps/site/social links
- responsive Idea cards

Definition of done:
- both members see the same persisted Ideas
- refresh does not lose data

## Milestone 4 — voting + Confirmed

Goal: complete the core product loop.

Tasks:
- vote buttons on cards
- upsert current user's vote
- display partner vote read-only
- realtime vote changes
- derive Confirmed
- default Ideas excludes Confirmed
- Confirmed page displays derived mutual picks
- manual confirm/unconfirm

Definition of done:
- two positive votes move the Idea from Ideas to Confirmed without manual status management
- a pass can reverse automatic confirmation
- manual confirmation works independently

## Milestone 5 — Schedule

Goal: make agreed plans usable as an itinerary.

Tasks:
- date/time editing for Ideas
- schedule query for dated Ideas
- schedule query for dated Bookings
- normalize and merge timeline data
- group by day
- sort chronologically
- render vertical itinerary
- document timezone behavior

Definition of done:
- dated Idea and dated Booking appear on correct day in chronological order

## Milestone 6 — Bookings

Goal: operational travel info lives in one place.

Tasks:
- CRUD
- booking type display
- useful card formatting
- confirmation/provider/URL fields
- schedule integration

Definition of done:
- flights/hotels/restaurants/events can be stored and retrieved quickly

## Milestone 7 — Wishlist + Notes

Goal: remove remaining need for Notion planning pages.

Tasks:
- Wishlist CRUD/check-off
- Notes CRUD
- mobile-friendly forms

Definition of done:
- both persist and sync between users

## Milestone 8 — polish

Only after the core loop works.

Tasks:
- loading/error/empty states
- mobile navigation refinement
- card spacing/typography
- fast Add Idea experience
- simple filters: city/type/added-by
- installable PWA if low effort

## Milestone 9 — migrate current trip

Tasks:
- export/migrate existing Notion Ideas
- preserve names, city, neighborhood, type, links, notes, existing cover images where feasible
- migrate current bookings/flights
- migrate wishlist and useful notes
- do not import obsolete Notion workflow/status fields

## Deferred backlog

- calendar view
- URL metadata scraping
- paste TikTok/Instagram/Maps quick import
- push notifications
- map pins
- richer notes
- offline/PWA caching
- multi-trip management UI
