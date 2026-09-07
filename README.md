# Shortlist — landing page

Marketing site for **Shortlist** (working name): a paid web service that tells Canadian job seekers which postings are worth applying to, what those roles actually pay in their city, and rewrites the resume for the ones that pass. Windsor–Essex, Ontario. All prices CAD.

Built with Next.js (App Router, Turbopack), TypeScript, CSS Modules, GSAP ScrollTrigger and Lenis smooth scrolling. No UI framework, no Tailwind.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint
```

Node 20.9+ is required by Next.js 16.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home: hero with the tile diagram, verdict cloud, bento, six rules, pricing and organizations teasers |
| `/how-it-works` | The seven-step pipeline, the bento, and Maria's end-to-end walkthrough |
| `/pricing` | Tiers, the full comparison matrix, add-ons, the 85-or-free guarantee, pricing FAQ |
| `/organizations` | Who seats are for, seat packages, how a pilot runs, organization FAQ |
| `/about` | Positioning (the three wedges), the six rules in detail, company |
| `/faq` | All questions, grouped by category |
| `/scan` | The free scan form, how it works, what you get, privacy FAQ |
| `/contact` | Email channels for customers, organizations and privacy requests |
| `/privacy`, `/terms`, `/refunds` | Plain-language legal drafts with a sticky table of contents |
| `not-found` | Styled 404 |

`sitemap.xml` and `robots.txt` are generated from `src/lib/site.ts`; set `NEXT_PUBLIC_SITE_URL` in production. `public/og.png` is the social preview image.

### Shared structure

- `Navbar` and `Footer` live in the root layout. The navbar marks the active page and its overlay menu closes on navigation.
- `PageHero` is the consistent header panel for every sub-page (eyebrow, blurred-in title, lead, actions, optional floating tiles).
- `CtaBand` is the ink-black closing call to action used at the bottom of every page.
- Section copy shared with the home page lives in `src/lib/content.ts`; page-level copy (process steps, comparison matrix, legal text, FAQ categories) lives in `src/lib/pages.ts`.

### Home page sections

| Section | Component | Notes |
| --- | --- | --- |
| Floating pill navbar | `Navbar` | Full-screen overlay menu on phones, Escape to close |
| Hero with connected floating tiles | `Hero` | Wires draw in, tiles float, pointer parallax on desktop, headline A/B test |
| "The only tool that will tell you not to apply" | `VerdictCloud` | Parallax cloud of example verdict cards; auto-scrolling strip on phones |
| Everything in the package | `Bento` | 3 + 2 grid with animated mini-UIs: score bars, pay report stack, red-flag doc, metric interview, Plan B orbit |
| Six rules we never break | `RulesFan` | Fanned arc carousel, auto-advances, click or dot to select |
| Pricing and organizations teasers | `Teasers` | Compact previews linking to the full pages |
| Footer | `Footer` | Link columns and the giant coral wordmark with a blur sweep |

## Design system

Tokens are CSS custom properties in `src/app/globals.css` (colours, radii, shadows, type scale, easings). Headlines use Inter Tight, body text uses Outfit, both self-hosted through `next/font`. The page is light-only by design.

Motion:

- `SmoothScroll` runs Lenis synced to GSAP's ticker and ScrollTrigger.
- `RevealManager` animates anything tagged `data-reveal` (fade, rise, blur) and `data-reveal-text` (word-by-word motion-blur reveal, see `BlurText`). It re-initialises on every route change; elements already in view animate in immediately, the rest wait for ScrollTrigger.
- Everything respects `prefers-reduced-motion`: smooth scrolling is skipped, reveals are instant, autoplay carousels stop.
- Content is fully visible with JavaScript disabled; the inline bootstrap script marks `html.js` before first paint so hidden-until-revealed states never flash.

## Headline A/B test

Two headline variants are built in, per the business plan's open decision:

- `a` — "Stop applying to 200 jobs." (sells the filter)
- `b` — "Know what the job actually pays." (sells the salary data)

The variant is chosen before first paint: `?h=a` or `?h=b` in the URL wins, then `localStorage` (`sl_headline`), then a coin flip. The choice is stamped on `<html data-headline="a|b">` so analytics can read it. Logic lives in `src/lib/headline.ts`.

## The free scan API

`src/app/api/scan/route.ts` validates the request (email, posting length, file name/size/type) and currently returns `501 scanner_not_connected`. The client only sends file metadata, so resume bytes never leave the browser until the pipeline exists. The intended flow (Stage 1 extractor, deterministic scorer, email delivery, one scan per email per 7 days, delete the file after scoring) is documented at the top of that file. Switch the client to multipart `FormData` when wiring it.

## Things still to decide (from the plan)

- **Name and domain.** "Shortlist" is a placeholder; `hello@shortlist.ca` in `content.ts` is too. Check `.ca` availability and CIPO before launch.
- **Legal pages.** `/privacy`, `/terms` and `/refunds` are plain-language drafts written from the business plan. Review them with counsel before launch. Choices made in the drafts that you may want to change: free-scan files deleted within 24 hours, paid files kept for the access period plus 30 days, a 14-day window to claim the guarantee, a 48-hour unused-pass refund, and the fair-use caps (50 and 150 packages) stated in the terms as the plan intends.
- **Sign in.** There is no sign-in button; the thin slice ships without accounts. Add one when accounts exist.
- **Fair-use caps** for the passes live in the terms and are deliberately not shown anywhere in the UI.
- **Payments.** CTAs scroll to the free scan; wire Stripe Checkout links to the paid tiers when ready.
