# Trip Hub lightweight design system

This foundation takes visual cues from the supplied mobile travel reference without copying its screens. Page structure and interaction flows should follow the Trip Hub product specs and the approved Figma mocks.

## Design character

- **Warm and optimistic:** a cream canvas and restrained travel-inspired pastels keep planning inviting.
- **Operationally clear:** important actions and travel details use deep indigo, high-contrast treatment.
- **Soft, not decorative:** rounded surfaces and gentle elevation create hierarchy without adding visual noise.
- **Compact on mobile:** pills, cards, and controls remain thumb-friendly while conserving vertical space.
- **Content first:** photography may provide delight, but critical information must never depend on an image.

## Semantic color tokens

| Token | Value | Purpose |
|---|---:|---|
| `--color-canvas` | `#f3f0e7` | App background |
| `--color-surface` | `#fffefa` | Cards, forms, floating navigation |
| `--color-ink` | `#20283a` | Primary text |
| `--color-muted` | `#6d6c66` | Secondary copy and metadata |
| `--color-border` | `#dfdbcf` | Quiet separation |
| `--color-primary` | `#2f3f60` | Navigation, primary actions, focus hierarchy |
| `--color-accent` | `#bd6048` | New-item actions and warm emphasis |
| `--color-accent-soft` | `#f4d8cf` | Accent backgrounds |
| `--color-sky` | `#c9e4eb` | Travel and transit highlights |
| `--color-sage` | `#d2e5d2` | Confirmed and positive states |
| `--color-butter` | `#f0dda9` | Attention and priority highlights |
| `--color-lavender` | `#dad8ec` | Experiences and secondary categories |
| `--color-danger` | `#9a3f2d` | Destructive actions and errors |

Pastels are background accents only. Text placed on them must use `--color-ink` or another accessible dark color.

## Typography

- UI and body: native system sans-serif for speed and cross-platform clarity.
- Headings: the native rounded system stack where available.
- Page title: `32–40px`, tightly tracked, bold.
- Section title: `22–28px`, bold.
- Card title: `16–18px`, bold.
- Body: `15px / 1.55`.
- Metadata: `12–13px`; uppercase is reserved for short eyebrows only.
- `12px` is the normal minimum. `10px` is reserved for exceptional, non-essential captions.

## Spacing and shape

- Spacing scale: `4, 8, 12, 16, 24, 32, 48px`.
- Control radius: `12px`.
- Card radius: `20px`.
- Feature/hero radius: `28px`.
- Pill radius: `999px`.
- Minimum interactive height: `44px`.
- Use one primary surface per content group; avoid nested bordered cards without clear hierarchy.

## Elevation

- Most surfaces use a border and no shadow.
- Cards may use `--shadow-sm` for quiet separation.
- Floating navigation and temporary menus use `--shadow-lg`.
- Hover elevation is desktop-only feedback and must not be required to understand interactivity.

## Core UI patterns

### Buttons

- The system uses the public shadcn/ui button variant model, adapted to the app's plain CSS and tokens rather than importing its Tailwind implementation.
- Default/primary: deep indigo fill and white label; use one primary action per region.
- Outline/secondary: surface fill with a quiet border for Cancel, Upload file, and supporting actions.
- Ghost/icon: transparent or quiet circular surface for compact actions such as View all and menus.
- Destructive: quiet red outline by default and placed away from the primary save action.
- Default height is `40px`, radius is `10px`, horizontal padding is `14px`, and labels are `13px / 700`.
- Every variant shares hover, active, disabled, and keyboard-focus feedback. Icon-only controls retain an accessible name.

### Cards

- White surface, 20px radius, quiet border.
- Keep the title and the most useful operational metadata visible without opening details.
- Category chips use pastel backgrounds with dark text.

### Navigation

- The trip title and desktop tab row remain sticky while page content scrolls.
- Desktop uses friendly icon-over-label tabs with a restrained active underline.
- Mobile uses a floating bottom bar for Schedule, New Idea, and the user avatar. The avatar opens account actions and the remaining trip sections.

### Forms

- Labels sit directly above fields.
- Optional fields may be progressively disclosed for fast capture.
- Errors appear next to the form action and use plain language.

## Responsive rules

- Design at `390px` first, then expand to tablet and desktop.
- Primary actions become full-width when space is constrained.
- Two-column metadata collapses to one column below `580px`.
- Bottom navigation must not cover the final interactive item; page shells include safe padding.

## Figma handoff rules

- Map Figma colors and measurements to semantic tokens instead of adding one-off values.
- A mock may introduce a new component or layout, but a new token requires a reusable semantic purpose.
- Preserve established Trip Hub behavior unless a mock explicitly proposes a flow change for review.
