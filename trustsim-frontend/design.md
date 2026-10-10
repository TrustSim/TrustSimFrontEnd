# Design — TrustSim Admin Platform

A locked design system for TrustSim. Every page and component redesign reads this file before emitting code. Do not regenerate per page — extend or amend this file when the system needs to grow.

## Genre
`modern-minimal` (High-trust Fintech & Digital Asset Exchange aesthetic)

## Macrostructure Family
- **Admin & Operational Cockpit Pages:** `Workbench` (Command Bar + Flat KPI Strip + Tabular Monitor + Slide-over Inspection Drawers)
- **Settings & Account Pages:** `Long Document` (Editorial section dividers, inline key-value pairs)
- **Public Market & Auctions:** `Bento Grid` / `Marquee Hero` (Visual density, card hierarchy, high contrast)

## Theme & OKLCH Palette
Anchored on TrustSim Brand DNA: Deep Navy (`#001743`) ink and controlled Crimson Red (`#E4011E`) accent (footprint ≤ 5% per viewport).

- `--color-paper`:      oklch(98.5% 0.005 250) /* Soft off-white base; warm and easy on the eyes */
- `--color-paper-2`:    oklch(100% 0 0)        /* Pure white for foreground elevated surfaces */
- `--color-paper-3`:    oklch(96% 0.008 250)  /* Subtle neutral fill for table headers & tags */
- `--color-ink`:        oklch(22% 0.04 260)   /* Deep Navy ink (#001743) */
- `--color-ink-2`:      oklch(46% 0.02 260)   /* Secondary slate ink for labels & captions */
- `--color-ink-muted`:  oklch(65% 0.015 260)  /* Tertiary muted ink */
- `--color-rule`:       oklch(91% 0.006 250)  /* Hairline border (1px crisp edge) */
- `--color-rule-subtle`:oklch(95% 0.004 250)  /* Inner divider */
- `--color-accent`:     oklch(55% 0.22 25)    /* TrustSim Crimson Red (#E4011E) */
- `--color-accent-ink`: oklch(99% 0 0)        /* Pure white text on accent background */
- `--color-accent-soft`:oklch(96% 0.03 25)    /* Soft red tint for badges & alerts */
- `--color-success`:    oklch(58% 0.16 145)   /* Muted emerald for verified/safe */
- `--color-warning`:    oklch(68% 0.17 65)    /* Warm amber for pending/urgent */
- `--color-focus`:      oklch(55% 0.22 25)    /* 2px solid instant outline on focus-visible */

## Typography
- **Display & Headings:** `Inter`, font-weight 600–700, `font-style: normal` (Roman only, zero italics on headings), tracking `-0.02em`.
- **Body:** `Inter`, font-weight 400–500, line-height 1.55.
- **Numerals & Codes:** `JetBrains Mono` / system monospaced, `font-variant-numeric: tabular-nums`.

## Spacing & Geometry
- Spacing scale: multiples of 4px (`--space-2xs: 4px`, `--space-xs: 8px`, `--space-sm: 12px`, `--space-md: 16px`, `--space-lg: 24px`, `--space-xl: 32px`).
- Radius:
  - Small tags & buttons: `6px` (`--radius-sm`)
  - Panels & Tables: `10px` (`--radius-md`)
  - Modals & Drawers: `14px` (`--radius-lg`)

## Motion & Easings
- Easings: `cubic-bezier(0.16, 1, 0.3, 1)` named `--ease-out`.
- Transitions: Specific properties only (`background-color`, `border-color`, `transform`, `opacity`). **Never use `transition-all`.**
- Duration: `--dur-fast: 120ms`, `--dur-short: 180ms`.
- Pulse: Single subtle heartbeat pulse on live connection header. Zero gratuitous `animate-ping` across inner tables.

## Copy & Metrics Honesty
- **No invented metrics:** If a metric is not yet provided by backend API, display honest fallback `—` with `Chờ dữ liệu` label. Never fabricate conversion rates or arbitrary AI confidence scores.
- **Microinteractions stance:** Silent success for visible state updates. Toast notifications reserved for background errors or reversible actions with an explicit `Undo` trigger.
