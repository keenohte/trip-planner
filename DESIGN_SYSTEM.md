# Trip Hub design system

Trip Hub uses the **Overcast** visual system: a cool daylight-neutral canvas, crisp white surfaces, and deep petrol interactive chrome. Color is intentionally restrained so travel photography and the travelers' decisions remain the focus.

The implementation source of truth lives in:

```
app/styles/tokens.css
app/styles/base.css
app/styles/components/*.css
components/ui/
app/_design/page.tsx
```

`app/globals.css` is only the cascade-layer and import manifest. Do not add component rules to it. `app/styles/legacy.css` contains frozen pre-system styling and should shrink as remaining screens migrate.

## Principles

- **Content first:** photography, titles, and useful trip details lead.
- **One interaction color:** petrol identifies navigation, actions, focus, and other interactive affordances.
- **Color communicates state:** rose means Love; gold is reserved for mutual agreement.
- **Consistent components:** a Button or Card keeps the same visual contract wherever it appears.
- **Quiet hierarchy:** most surfaces use a subtle border, with elevation reserved for cards and temporary floating UI.
- **Responsive by default:** controls remain touch-friendly and layouts collapse without changing their meaning.

## Tokens

All raw values are defined in `app/styles/tokens.css`. New UI must use semantic tokens rather than raw hex, RGB, spacing, radius, or shadow values.

### Color

| Semantic token | Purpose |
|---|---|
| `--canvas` | Cool neutral app background |
| `--surface` | Cards, forms, menus, and raised content |
| `--surface-sunken` | Recessed and quiet control backgrounds |
| `--text-primary` | Primary text and high-emphasis icons |
| `--text-muted` | Secondary text and metadata |
| `--text-on-fill` | Text placed on strong filled controls |
| `--border-subtle` | Default separators and borders |
| `--border-strong` | Higher-emphasis boundaries |
| `--primary` | Interactive petrol |
| `--primary-hover` | Hover and pressed interactive state |
| `--primary-soft` | Low-emphasis interactive background |
| `--danger` | Destructive actions and errors |
| `--love` / `--love-soft` | A traveler's Love vote |
| `--mutual` / `--mutual-ink` / `--mutual-soft` | Mutual agreement only |
| `--traveler-a-*` / `--traveler-b-*` | Traveler avatar treatments only |

Interested and Pass remain neutral. Category chips are also neutral: taxonomy must not compete visually with vote state.

Gold is the product's payoff color. Do not use mutual tokens for ordinary decoration, navigation, hover states, or generic success messages.

### Spacing

Use the complete spacing scale:

| Token | Value |
|---|---:|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |

### Shape and elevation

| Token | Purpose |
|---|---|
| `--radius-control` | Inputs and buttons |
| `--radius-card` | Standard cards |
| `--radius-feature` | Large feature surfaces |
| `--radius-pill` | Pills and circular controls |
| `--shadow-sm` | Quiet card elevation |
| `--shadow-lg` | Modals, popovers, and floating UI |
| `--focus-ring` | Shared keyboard focus treatment |
| `--target-min` | Minimum interactive target size |

### Typography

Inter is loaded through `next/font` and exposed as `--font-inter`. Both body and display stacks use it with system fallbacks.

| Token | Size |
|---|---:|
| `--text-xs` | 12px |
| `--text-sm` | 13px |
| `--text-base` | 15px |
| `--text-lg` | 18px |
| `--text-xl` | 24px |
| `--text-2xl` | 32px |

Use only normal, medium, and bold weights through `--weight-normal`, `--weight-medium`, and `--weight-bold`.

## Cascade and file ownership

The global layer order is:

```css
@layer tokens, base, legacy, components, overrides;
```

Later layers win regardless of selector specificity. New component rules belong in `@layer components` and in the corresponding file under `app/styles/components/`. Do not append a new styling pass, add another `:root`, or use `!important` to defeat an earlier rule.

Avoid placing a legacy class and a migrated component class on the same element. Their styles combine across layers and can create hidden dependencies. When a screen migrates, remove its obsolete rules from `legacy.css` as part of the same focused change.

## Components

### Button

Use `components/ui/Button.tsx` for buttons and links styled as buttons. Supported variants are named in that component and share consistent hover, active, disabled, and focus behavior.

Do not add one-off `className` or inline-style patches. If a genuinely reusable visual variation is needed, add a named component variant and document it in the `/_design` showcase.

Icon-only buttons require an accessible name and must retain the minimum target size.

### Card

Use the primitives exported by `components/ui/Card.tsx`, including Card, CardMedia, CardBody, CardTitle, CardMeta, CardFooter, CardButton, Chip, and ChipList.

A card should look consistent in every grid. Do not write context selectors such as `.some-grid .card`. Represent meaningful structural differences through a named Card prop or variant.

The information hierarchy is:

1. Image or media
2. Title
3. Useful location or schedule metadata
4. Vote state
5. Neutral category chips

### Tabs, toolbars, voting, and schedule

- Desktop tabs use the shared horizontal icon-and-label treatment.
- Toolbars use the shared search, filter, action, and popover patterns.
- Vote presentation is derived through `lib/vote-state.ts`; do not duplicate vote-state logic in individual views.
- Schedule cards and their timeline rail use the shared schedule primitives and alignment rules.

## Forms and temporary UI

- Labels sit directly above fields.
- Use shared spacing and control dimensions.
- Errors use plain language near the relevant form or its actions.
- Menus, popovers, and date pickers close when focus moves outside them.
- Sticky modal actions must not overlap fields or dropdown content.

Modal internals and the date picker remain transitional legacy UI. Reuse their existing shared components until they are deliberately migrated.

## Responsive behavior

- Start with the narrow/mobile layout, then expand.
- Preserve a minimum 44px interactive target.
- Collapse dense metadata and multi-column controls without changing semantics.
- Mobile navigation must not cover the final interactive content.
- Do not create page-specific card appearances at different breakpoints.

## Migration status

Migrated:

- Ideas and Confirmed
- Schedule
- PersistedIdeaCard and BookingCard
- VoteControls
- IdeasBrowser and ScheduleBrowser
- NewIdeaTrigger
- Desktop tabs
- Chips in both idea and schedule-activity modals

Still in `legacy.css`:

- Home
- Bookings, Wishlist, and Notes page shells
- Mobile tab bar
- Modal internals
- Date picker

`components/IdeaCard.tsx` and `lib/data.ts` are known, unreferenced pre-Supabase code. Their removal must be a separate deliberate change. The transitional `className` prop on `NewIdeaTrigger` remains necessary until Nav and Home migrate.

## Verification

After meaningful visual or component changes:

1. Run `npx tsc --noEmit`.
2. Run `npm run build`.
3. In development, review `/_design` for component consistency.
4. Review affected pages at desktop and mobile widths.
5. Check keyboard focus, hover, active, disabled, and empty states.

The `/_design` route intentionally renders nothing in production.
