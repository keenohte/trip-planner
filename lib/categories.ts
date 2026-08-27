import type { LucideIcon } from 'lucide-react';
import { BedDouble, Bike, CalendarDays, Landmark, Martini, Plane, ShoppingBag, Ticket, TrainFront, UtensilsCrossed } from 'lucide-react';

export const ideaCategories = ['food', 'drink', 'shopping', 'sight', 'activity'] as const;
export type IdeaCategory = (typeof ideaCategories)[number];

export const categoryMeta: Record<IdeaCategory, { label: string; icon: LucideIcon }> = {
  food: { label: 'Food', icon: UtensilsCrossed },
  drink: { label: 'Drink', icon: Martini },
  shopping: { label: 'Shopping', icon: ShoppingBag },
  sight: { label: 'Sight', icon: Landmark },
  activity: { label: 'Activity', icon: Bike },
};

/* Derived from the actual vocabulary in the trip, not invented. Every
   term that existed at migration time appears here, so nothing fell into
   a catch-all bucket. New terms simply stay tags. */
const termToCategory: Record<string, IdeaCategory> = {
  food: 'food', restaurant: 'food', noodles: 'food', izakaya: 'food',
  pizza: 'food', yakiniku: 'food', sushi: 'food', american: 'food',

  drink: 'drink', bar: 'drink', cafe: 'drink', matcha: 'drink',
  speakeasy: 'drink', wine: 'drink',

  shopping: 'shopping', thrift: 'shopping', jewelry: 'shopping',
  market: 'shopping', vinyl: 'shopping',

  sight: 'sight', temple: 'sight', neighborhood: 'sight',

  /* Outdoors rolls into Activity — too few genuinely outdoor ideas to
     earn a category of its own. `outdoors` and `forest` survive as tags,
     so nothing is lost. */
  activity: 'activity', transit: 'activity', outdoors: 'activity', forest: 'activity',
};

/* Terms that only restate a category. Dropped ONLY when they name the
   category that won — "Restaurant, Food" becomes Food with no tag,
   but "Sight, Outdoors" keeps `outdoors` as a tag because it is real
   information the category does not carry.

   "Bar" and "Cafe" are absent here on purpose: they are genuinely
   different places, not synonyms for Drink. */
const genericTerms = new Set(['food', 'restaurant', 'drink', 'shopping', 'sight', 'activity']);

export function categoryForTerm(term: string): IdeaCategory | null {
  return termToCategory[term.trim().toLowerCase()] ?? null;
}

/* The FIRST recognised term wins. Order is what the person typed, so it
   carries intent that no priority list of mine would: "Bar, Vinyl" is a
   vinyl bar (Drink), while "Vinyl, Bar" would be a record shop. */
export function splitTypes(types: string[]): { category: IdeaCategory; tags: string[] } {
  let category: IdeaCategory | null = null;
  const tags: string[] = [];

  const cleaned = types.map((raw) => raw.trim()).filter(Boolean);
  for (const term of cleaned) {
    const matched = categoryForTerm(term);
    if (matched && !category) category = matched;
  }
  const resolved = category ?? 'activity';

  for (const term of cleaned) {
    const lower = term.toLowerCase();
    const redundant = genericTerms.has(lower) && categoryForTerm(lower) === resolved;
    if (!redundant) tags.push(lower);
  }

  return { category: resolved, tags: [...new Set(tags)] };
}

/* Schedule mixes ideas, bookings and activities. Bookings already have a
   clean enum ('flight', 'hotel'…) and activities are always 'Activity',
   so rather than migrating two more tables we map them into the same
   {label, icon} shape at display time. One chip vocabulary, no schema
   churn. */
export type ChipMeta = { label: string; icon: LucideIcon };

const bookingMeta: Record<string, ChipMeta> = {
  flight: { label: 'Flight', icon: Plane },
  hotel: { label: 'Stay', icon: BedDouble },
  train: { label: 'Train', icon: TrainFront },
  ticket: { label: 'Ticket', icon: Ticket },
};

export function bookingChip(type: string): ChipMeta {
  return bookingMeta[type.toLowerCase()] ?? { label: 'Booking', icon: CalendarDays };
}

export const activityChip: ChipMeta = { label: 'Activity', icon: Bike };

/* For <option> labels and anywhere a real cased string is needed.
   CSS text-transform does not apply reliably inside a native <select>. */
export function formatTag(tag: string): string {
  return tag.replace(/\b\w/g, (character) => character.toUpperCase());
}
