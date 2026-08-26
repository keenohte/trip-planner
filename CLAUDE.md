# Trip Hub — working rules for coding agents

Read `DESIGN_SYSTEM.md` for the visual spec. This file is about how to
not break it.

## The one rule that matters

**Never add a new `:root` block. Never append a new "pass" to the end of a
stylesheet.**

The app previously accumulated six sequential visual systems stacked on top
of each other — five `:root` blocks, `.tab` redefined ten times,
`.schedule-card` touched twenty-six times. What rendered was the accidental
intersection of all of them. If a value is wrong, change it where it is
defined. Do not out-specify it from below.

## Where things live

```
app/styles/tokens.css              the ONLY file with raw values
app/styles/base.css                reset, document defaults, focus ring
app/styles/components/*.css        one file per component
app/styles/legacy.css              frozen old CSS. Shrinks, never grows.
components/ui/                     Button, Card and friends
app/_design/page.tsx               kitchen sink (dev only)
```

`app/globals.css` declares layer order only. `app/layout.tsx` imports every
global stylesheet directly so Next.js keeps them attached across route
navigation. Do not put component rules in `globals.css`.

## Tokens

Two tiers. **Primitives** (`--raw-*`) exist only to define semantic tokens
and must never appear in a component file. **Semantic** tokens
(`--surface`, `--text-muted`, `--primary`, `--space-4`, `--radius-card`)
are the entire vocabulary available to components.

Adding a semantic token is allowed when it names a reusable purpose. Adding
a raw hex, px, or rgba value to a component file is not. If you find
yourself needing `#e8e4dd`, the answer is an existing token.

The scales are deliberately small and complete:

- spacing: `4 8 12 16 24 32 48` — nothing between
- radius: `control(12) card(20) feature(28) pill(999)` — four, total
- type: `xs(12) sm(13) base(15) lg(18) xl(24) 2xl(32)` — six
- weight: `400 600 700` — three
- shadow: `sm lg` — two

## Cascade layers

Declared order: `tokens, base, legacy, components, overrides`.

Later layers win regardless of selector specificity. That is why
`components/card.css` can use a flat `.card` selector and still beat
`legacy.css`'s `.home-card-grid .idea-card`. Put new component rules in
`@layer components`. Do not write descendant chains to win specificity
fights, and do not use `!important` — if you think you need it, you are
putting the rule in the wrong layer.

## Components

There is one `Card` and one `Button`. Use them.

`Button` and `Card` deliberately omit `className` and `style` from their
public props. This is not an oversight. A visual variation must become a
named variant in the component, not a patch at the call site.

**A card looks the same in every grid it lands in.** Do not write
`.some-grid .card { ... }`. If a card needs to differ, that is a prop.

Before creating a new component, check `components/ui/` and the kitchen
sink at `/_design`. The previous drift happened largely because the agent
could not find the existing thing and made a second one.

## Colour is for state, not taxonomy

Category chips are neutral. This is deliberate. In a card grid the eye
should travel photo -> title -> vote state, and a colour-per-category
rainbow competes with the only signal that carries a decision.

`--mutual` (gold) means both travellers said yes. It is the payoff moment
of the entire product. Do not use it for ordinary chrome, hover states, or
decoration — if gold appears everywhere it stops meaning anything.

`--love` (rose) is the Love vote. Interested and Pass are intentionally
colourless: a lukewarm vote should not compete with a match.

Never key a colour off `:nth-child`. `types` is a free-form array, so
position-based colouring made the same tag render differently depending on
tag order.

## Migration status

Migrated to the new system (do not add legacy classes to these):
`Ideas`, `Confirmed`, `Schedule`, `PersistedIdeaCard`, `BookingCard`,
`VoteControls`, `IdeasBrowser`, `ScheduleBrowser`, `NewIdeaTrigger`,
desktop `tabs`, and chips in both modals.

Still on `legacy.css`: Home, Bookings/Wishlist/Notes page shells, the mobile
tab bar, modal internals, and the date picker.

Known dead code (pre-Supabase, unreferenced): `components/IdeaCard.tsx` and
`lib/data.ts`. Left in place — delete deliberately, not as a side effect.

When you migrate a screen, delete its rules from `legacy.css` in the same
change. That file only shrinks. It is the progress bar.

## Verification

Run `npm run build` after meaningful changes. Check `/_design` in dev for
any component you touched — that page exists so inconsistency is visible
side by side rather than spread across screens.
