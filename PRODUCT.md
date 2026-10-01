# Product
<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
- **Producción** (the owner, a single producer): builds welovepaving.com pages directly in WordPress and uses PageOps every working day, on desktop, to see which pages are in progress, what is waiting on review, and what is left to fix before publishing.
- **Admin** (the reviewer, Alan): opens the app from a shared link to look at pages, approve them or ask for changes, and leave notes. Never called by a personal name inside the app; the role is "Admin".

## Product Purpose
Replace the Google Sheet that tracked page production. Each page moves through Por hacer → En curso → QA → Revisión Admin → (Cambios solicitados) → Publicado, with tasks, a QA checklist, notes and an automatic activity log. Success: nothing gets lost between building, QA, review and publishing, and the producer can see at a glance what needs attention.

## Positioning
A private control panel shaped exactly around one producer's WordPress page workflow and the WLP QA protocol (PageSpeed 80+/90+, noindex, alternating backgrounds, no faces, «California» only, FAQs in GenerateBlocks, the panda never covering buttons on mobile, WP Rocket cache, final report with QR, WCAG AA). Generic boards cannot carry that protocol.

## Operating Context
- Pages are built in WordPress; each page links to its WP preview, WP editor, public URL and documentation folder.
- Page types: Páginas Principales, Servicios Core, Empleos, Landing Pages.
- Work items per page: the main V2 build plus "Ajuste" follow-ups on already-published pages.
- QA statuses: Pendiente / Pasa / No pasa (opens a critical task) / No aplica (reason required).
- Tickets: general to-dos not tied to one page, closed by tearing the ticket stub; closed tickets go to a history.
- "Editando como" switch (Producción / Admin) signs notes and activity while there is no per-user login; a shared password protects the app.

## Capabilities and Constraints
- Next.js 16 App Router on Netlify, data in Netlify Blobs (`pageops-v2`), JSON backup at `/respaldo`.
- Interface language: Spanish.
- Data-care rule: download the backup before any change that touches stored data; migrations write an automatic backup.
- Hobby / internal use only; not a public or commercial product.

## Brand Commitments
- We Love Paving brand: yellow `#F2C230`, warm asphalt black, warm concrete grays, Barlow (condensed) for display, Inter for text. Logo at `public/wlp-logo.png`.
- The user explicitly pinned a visual reference set (Oct 2026): black widget tiles with a folder-tab silhouette sitting on a light gray ground, inset saturated panels with a soft glow, large condensed numerals, soft raised dark buttons, a colored strip peeking from under a card.

## Evidence on Hand
- 25 real pages seeded from the original sheet (`lib/seed.ts`, `docs/datos-iniciales.csv`).
- No testimonials, metrics or external claims exist or should be invented.

## Product Principles
1. What needs attention first is visible first: blocked work, failing QA, pages waiting on the Admin.
2. One place per fact: no field shown twice, no redundant panels.
3. Every change leaves a trace in Actividad.
4. Fast to operate with keyboard: `/` search, `N` new page, Alt+arrows on the board.

## Accessibility & Inclusion
WCAG AA: text contrast ≥ 4.5:1, visible keyboard focus, named buttons and links, reduced-motion respected.
