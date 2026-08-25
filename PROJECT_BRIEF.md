# Trip Hub — Project Brief

## Overview

Trip Hub is a deliberately small collaborative travel planner for **two people planning a shared trip**. It exists because general-purpose tools such as Notion become cluttered when asked to behave like a purpose-built travel product.

The app should feel more like a tiny shared product than a database: quick to add to, quick to vote in, easy to scan, and useful while actually traveling.

## Initial real-world use case

The first live trip is a Korea + Japan trip in fall 2026. The app should be generic enough for future trips, but the product should be shaped by this concrete use case rather than theoretical scale.

Initial route for seed/testing context:

- New York → Seoul
- Seoul → KIX
- Kyoto
- Tokyo
- New York

Dates: Oct 23–Nov 7, 2026.

## Primary users

Two travelers in the same trip.

Both users should be peers. Either person can add ideas, vote, schedule plans, add bookings, maintain wishlist items, and write notes.

## Product goals

1. Make dumping an idea take only a few seconds.
2. Make independent voting obvious and low-friction.
3. Automatically surface mutual interest without requiring manual database-state management.
4. Separate "things we might do" from "things we agreed on" from "things that are actually scheduled/booked."
5. Make the app useful both during planning and while on the trip.
6. Keep navigation flat and predictable.
7. Keep operating/maintenance costs near zero for private use.

## Navigation

Primary app navigation:

- Home
- Confirmed
- Ideas
- Schedule
- Bookings
- Wishlist
- Notes

On mobile, this may become a compact horizontal tab bar or bottom navigation. The information architecture matters more than the exact control.

## Core mental model

### Ideas

The shared brainstorming dump. Adding an Idea does **not** imply commitment.

Examples:
- restaurant
- cafe
- shop
- temple
- neighborhood
- museum
- bar
- workshop
- scenic spot
- day trip

Each user votes independently:

- ❤️ Love
- 👍 Interested
- ❌ Pass

### Confirmed

A computed view of Ideas that both travelers want to do, plus anything manually confirmed.

An Idea is Confirmed when:

- both trip members vote `love` or `interested`, OR
- `manually_confirmed = true`.

Confirmed should **not show voting controls as the primary interaction**. It should feel like the clean list of things the pair has agreed on.

Flights/hotels do not belong here.

### Schedule

The trip rendered day by day.

Anything with a date/time can appear here:

- scheduled Ideas
- flights
- hotels
- trains
- restaurant reservations
- ticketed events
- experiences

Primary presentation: vertical chronological itinerary grouped by day.

Secondary future presentation: calendar.

### Bookings

Anything reserved, purchased, ticketed, or operationally important.

Examples:
- flight
- hotel
- train
- restaurant reservation
- experience
- attraction ticket
- event
- transit booking

### Wishlist

Trip goals that are not primarily destinations.

Examples:
- buy a specific item
- find a souvenir
- try a particular food
- look for a product/category
- small experiential goal

### Notes

Shared trip notebook for:
- tips
- cultural/etiquette notes
- transit reminders
- packing info
- open decisions
- general planning notes

## Success criteria

The product is successful when the pair stops needing a separate planning database for day-to-day trip coordination.

Useful behavioral signals:

- both users add Ideas without hesitation
- both vote directly from the browsing surface
- mutual picks require no manual bookkeeping
- the Schedule can be opened during the trip and understood immediately
- booking confirmation information is easy to retrieve under time pressure

## Non-goals for v1

- public/social travel network
- destination discovery marketplace
- AI-generated itineraries
- automated airfare/hotel search
- expense tracking/splitting
- offline maps
- live flight tracking
- native mobile binaries
- complex notification rules
- influencer/content feeds

## Product principle

**Every feature must reduce travel-planning friction more than it adds interface complexity.**
