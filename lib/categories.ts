import type { LucideIcon } from 'lucide-react';
import { Bike, Landmark, Martini, ShoppingBag, UtensilsCrossed } from 'lucide-react';

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
