# TrustSim Admin Dashboard Override

This page override replaces the generated dark/IoT palette in `MASTER.md` while retaining its verified operating principles: Swiss/minimal structure, density 8/10, variance 3/10 and motion 2/10.

## Direction

- Product: internal auction, finance and trust operations console.
- Surface: light by default for long data-review sessions.
- Brand: TrustSim navy is the primary action and navigation color; crimson is reserved for brand emphasis and destructive/risk signals.
- Icon system: Lucide outline only. Use 16px in controls, 14px in dense tables and 18px in navigation. Decorative icons use `aria-hidden`; icon-only buttons require an accessible label.
- Data layout: table-first, server pagination, compact filters, stable column positions and tabular numerals.

## Semantic tokens

| Role | Value |
|---|---|
| Primary | `#001743` |
| Primary hover | `#00266B` |
| Brand/destructive accent | `#E4011E` |
| Canvas | `#F6F8FB` |
| Surface | `#FFFFFF` |
| Muted surface | `#F8FAFC` |
| Heading | `#101828` |
| Body | `#344054` |
| Muted text | `#667085` |
| Border | `#E4E7EC` |
| Strong border | `#D0D5DD` |
| Focus | `#2563EB` |

## Component rules

- Use Ant Design for Table, Form, Drawer, Modal, Upload, Select, DatePicker, InputNumber, Tabs/Segmented and Pagination.
- Keep Tailwind/CSS for page composition and brand-specific layout only.
- Create/edit opens in a Drawer; complex multi-step workflows use a dedicated route.
- Row actions use a single `MoreHorizontal` menu unless one action is overwhelmingly primary.
- Do not use emoji, gradients, decorative KPI cards, nested cards, exaggerated shadows or scale-on-hover.
- Every data view provides loading, empty, filtered-empty and error feedback.
- Verify at 375px, 768px, 1024px and 1440px.
