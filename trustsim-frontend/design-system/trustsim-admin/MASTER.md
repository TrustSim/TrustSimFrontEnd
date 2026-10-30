# TrustSim Admin Design System

Global source of truth for the TrustSim operations console. Page files in `pages/` may add domain-specific rules but must not replace these foundations.

## Product direction

- Internal auction, finance and trust-operations console.
- Swiss/minimal structure, variance 3/10, motion 2/10, density 8/10.
- Light surfaces for long data-review sessions; dark navy navigation provides orientation.
- Table-first management pages with server pagination and compact, labelled filters.

## Tokens

| Role | Value |
|---|---|
| Primary / navigation | `#001743` |
| Primary hover | `#00266B` |
| Brand / destructive emphasis | `#E4011E` |
| Canvas | `#F6F8FB` |
| Surface | `#FFFFFF` |
| Muted surface | `#F8FAFC` |
| Heading | `#101828` |
| Body | `#344054` |
| Muted text | `#667085` |
| Border | `#E4E7EC` |
| Strong border | `#D0D5DD` |
| Focus | `#2563EB` |

Use the matching `--admin-*` CSS variables in `app/globals.css`; do not add one-off colors inside components.

## Typography and spacing

- Inter remains the product font; monospace is limited to IDs, phone numbers and financial figures.
- Type roles: 17px page title, 13px body/control, 12px dense table content, 11px metadata.
- Spacing follows a 4/8px rhythm: 4, 8, 12, 16, 24 and 32px.
- Controls use a 40px desktop height and at least 44px on compact/touch layouts.
- Radius scale: 6px small, 8px control, 10px panel. Avoid nested oversized cards.

## Component ownership

- Ant Design owns Table, Pagination, Form, Drawer, Modal, Upload, Input, Select, DatePicker, InputNumber, Tabs/Segmented and feedback primitives.
- Tailwind/CSS owns page composition, responsive grids and TrustSim brand treatment.
- `AdminDataPrimitives.tsx` is the only shared entry point for management tables and icon-only table actions.
- `RightDrawer.tsx` wraps Ant Drawer and preserves keyboard focus, escape dismissal and responsive width.

## Icons

- Lucide outline is the only application icon family.
- 18px navigation, 16px controls, 14px dense table actions; stroke width 1.8.
- Decorative icons beside visible text use `aria-hidden="true"`.
- Icon-only controls require an accessible label and tooltip.
- Do not use emoji, mixed icon packs, filled/outline mixing, or color as the only status channel.

## Interaction

- One primary action per screen; row actions are quiet icon controls or a single overflow menu.
- Create/edit uses a Drawer. Complex multi-step flows use a dedicated route.
- Destructive actions use semantic danger styling and confirmation when irreversible.
- Motion is limited to 120–180ms color/opacity changes; no scale hover, transition-all or decorative entrance effects.
- Respect `prefers-reduced-motion`.

## Data views

- Preserve stable columns, tabular numerals and clear status text.
- Every list provides loading, empty, filtered-empty and error/retry feedback.
- Filters are labelled and reset page index when changed.
- At narrow widths, Ant Table owns internal horizontal overflow; the page itself must not scroll horizontally.

## Verification

- Keyboard navigation and visible focus.
- Normal text contrast at least 4.5:1; meaningful icons and controls at least 3:1.
- Responsive review at 375, 768, 1024 and 1440px.
- Production build, TypeScript and ESLint must pass before delivery.
