# Trip Hub — Current Trip / Notion Migration Notes

## Why migration is later

The current Notion workspace contains useful trip data, but its structure became more complicated than the desired product. The app should not reproduce that structure one-for-one.

First make the app's data model and collaboration loop correct. Then migrate only useful content.

## Source concepts to preserve

### Ideas / Places

Preserve where available:
- title
- country
- city
- neighborhood
- type(s)
- added by
- notes
- Google Maps URL
- website URL
- social URL
- image/cover
- existing meaningful votes
- potential/scheduled date only if still intentional

Do **not** preserve obsolete workflow values such as:
- Saved
- Interested status
- Shortlist status
- Booked status on an Idea

The app uses derived state instead.

### Vote mapping

Previous Notion voting evolved over time. Normalize into:

- old `Must` → `love`
- old `Love` → `love`
- old `Interested` → `interested`
- old `Flexible` → likely no vote (`NULL`) unless the user decides otherwise
- old `Skip` → `pass`
- old `Pass` → `pass`

Do not automatically infer a user's vote from an old workflow status.

### Confirmed mapping

After migration, Confirmed should be derived from normalized votes.

If there are places the pair explicitly considers confirmed despite incomplete votes, set `manually_confirmed = true`.

### Bookings

Preserve:
- flights
- hotels
- trains
- restaurant reservations
- booked experiences/events
- confirmation numbers
- dates/times
- route/city
- provider
- booking URLs
- notes

### Wishlist

Preserve useful items and map directly to `wishlist_items`.

### Notes

Copy only useful current travel notes and planning decisions. Do not import legacy database instructions or obsolete Notion housekeeping.

## Initial trip facts useful for seed/testing

Trip dates:
- Oct 23 – Nov 7, 2026

Route:
- New York → Seoul → KIX → Kyoto → Tokyo → New York

Known flights from planning context:
- Oct 23: JFK → ICN, Asiana OZ221
- Oct 31: ICN → KIX, Korean Air KE725
- Nov 7: NRT → TPE → JFK, EVA Air BR197 + BR32

Japan lodging plan at last planning point:
- Kyoto: Oct 31–Nov 2
- Tokyo: Nov 2–7

These facts are for development/seed convenience. Production migration should re-check current source data before import.

## Migration mechanism

Prefer a one-time script rather than manual re-entry once Supabase is ready.

Suggested location:

```text
scripts/import-trip-data.ts
```

The script should:
- use explicit structured input (JSON/CSV/export)
- be idempotent if practical
- log inserted/skipped rows
- avoid service-role credentials in committed files
