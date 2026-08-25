# Trip Hub — UX / Product Specification

## Design direction

Trip Hub should feel:

- lightweight
- warm
- visual
- intentional
- mobile-first
- calmer than a project-management tool

Avoid an enterprise-dashboard aesthetic. Avoid exposing implementation concepts such as database statuses, workflow states, relations, or IDs.

## Global navigation

Desktop/tablet:

`Home | Confirmed | Ideas | Schedule | Bookings | Wishlist | Notes`

Mobile:
- prefer a compact persistent navigation pattern
- do not require returning to Home to switch major sections
- keep the most-used destinations (Ideas, Confirmed, Schedule) one tap away

## Home

Purpose: orientation, not a dashboard full of duplicated data.

Show:
- trip name
- dates
- route summary
- optional compact "next up" section once scheduling is real
- clear navigation into planning areas

Do not stack full Ideas/Bookings/Schedule databases on Home.

## Ideas

This is the highest-priority interaction surface.

### Default presentation

Gallery of cards.

Each card should support:

- large cover image
- place/idea title — always visible
- city + neighborhood when available
- type chips
- "Added by" indicator, subtle
- current user's vote controls
- partner's vote shown as compact state

Suggested hierarchy:

```text
[ IMAGE ]
Place title
Tokyo · Ebisu
Restaurant · Nightlife

You:      ❤️  👍  ❌
Partner:  👍 Interested
```

### Voting

Voting must be possible from the card without opening a detail page.

Current user's choices:
- ❤️ Love
- 👍 Interested
- ❌ Pass

Only one can be selected. Tapping the selected vote again may either leave it selected or clear it; choose the simpler implementation initially and document it.

Partner's vote is read-only to the current user.

### Mutual-positive transition

When both votes are positive (`love` or `interested`), the Idea should animate minimally or simply disappear from the default Ideas list and become visible in Confirmed.

Avoid celebratory modal interruptions.

### Quick Add

Primary action: `+ Add idea`

The form should prioritize speed. Recommended fields:

Required:
- Title

Useful optional fields:
- Country
- City
- Neighborhood
- Type(s)
- Link / Google Maps URL
- Website/social URL
- Photo
- Notes

The user should be able to save with only a title and enrich later.

Future enhancement, not v1 requirement:
- paste a TikTok/Instagram/Maps URL and parse metadata

### Filters

v1 should support simple filtering if easy to implement:
- city
- type
- added by

Do not build a complex filter-builder UI.

## Confirmed

A clean shared shortlist.

Card should show:
- image
- title
- city/neighborhood
- types
- optional date if scheduled

Do not emphasize votes here.

Primary actions:
- Add/set date
- Open details
- Open Maps
- Undo manual confirmation if manually confirmed

Confirmed includes:
- mutual-positive Ideas
- manually confirmed Ideas

Confirmed excludes:
- flights
- hotels
- standalone bookings that are not Ideas

## Schedule

### Primary view

Vertical day-by-day itinerary grouped by local calendar date.

Example:

```text
SUN · NOV 1 — KYOTO

09:00  Fushimi Inari
12:30  Lunch
16:00  Kiyomizu-dera
19:00  Pontocho
```

Items may originate from either Ideas or Bookings.

### Visual distinction

Use icon/type labels rather than drastically different components:
- flight
- hotel
- train
- restaurant
- sight
- experience

### Time handling

For v1:
- store timestamps in UTC / timestamptz
- render in an appropriate trip/local timezone strategy
- do not silently assume the browser timezone is always correct during planning

Technical implementation should document timezone handling before production data migration.

### Secondary calendar

A calendar can be added after the day-by-day view is solid. Do not let calendar implementation block the initial usable itinerary.

## Bookings

List/cards optimized for retrieval.

Booking fields:
- type
- title
- start
- end
- city/route
- provider
- confirmation number
- booking URL
- notes

Examples:

Flight card:
```text
OZ221
JFK → ICN
Oct 23 · 11:45 AM
Asiana
```

Hotel card:
```text
Hotel name
Kyoto
Oct 31 → Nov 2 · 2 nights
Confirmation ABC123
```

Primary need: find operational information quickly.

## Wishlist

Simple list or compact cards.

Fields:
- title
- kind
- country
- city/area
- priority
- notes
- done

Optimize for checking things off while traveling.

## Notes

Simple shared notes.

For v1:
- title
- body
- created/updated timestamps
- author metadata if useful

Rich text is not required initially. Plain textarea/Markdown is sufficient.

## Detail pages / drawers

A card click may open a page, modal, or mobile sheet. Prefer the least-complex pattern that keeps browser navigation sensible.

Idea detail must support:
- title
- image
- metadata
- notes
- links
- voting
- manual confirm
- schedule date/time
- edit/delete

## Responsive requirements

Minimum supported experience:
- 360px mobile width
- tablet
- desktop

Critical actions must not depend on hover.

Tap targets for voting and navigation should be comfortably finger-sized.

## Accessibility baseline

- semantic buttons/links
- visible focus states
- text labels or accessible names for emoji vote buttons
- no color-only status communication
- sufficient contrast
- form labels tied to inputs
