# Orvenic

Marketing site and product app for **Orvenic** (orvenic.com): a paid web service that tells Canadian job seekers which postings are worth applying to, what those roles actually pay in their city, and rewrites the resume for the ones that pass. Windsor–Essex, Ontario. All prices CAD.

Built with Next.js (App Router, Turbopack), TypeScript, CSS Modules, GSAP ScrollTrigger and Lenis smooth scrolling. No UI framework, no Tailwind.

## Run it

```bash
npm install
cp .env.local.example .env.local   # everything local: emulators, mock AI, dev checkout
npm run emulators                  # Firebase Auth + Firestore emulators (needs Java 21+)
npm run dev                        # http://localhost:3000
npm test                           # unit tests (scorer, validator, parser, mock AI)
npm run e2e                        # browser end-to-end against the emulators (see e2e/README.md)
npm run build && npm start         # production build
```

Node 20.9+ is required by Next.js 16. With `.env.local.example` the whole product runs with no external accounts: Firebase emulators for sign-in and data, deterministic local logic instead of Claude, and a development checkout that grants purchases without payment. `GET /api/health` tells you which integrations are live.

### Going live

Copy `.env.example` to `.env.local` (or your host's environment) and fill in:

| Variable | What it is |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | Service-account JSON (or base64 of it) for the Admin SDK: Firebase console → Project settings → Service accounts → Generate new private key. Not needed on Google Cloud hosting with Application Default Credentials |
| `NEXT_PUBLIC_FIREBASE_*` | Only to point at another Firebase project. The web config for `resume-project-56b09` is built into `src/lib/firebase/client.ts`; set `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` empty to turn Google Analytics off |
| `ANTHROPIC_API_KEY` | Claude. Routing: Haiku 4.5 extracts and parses, Sonnet 5 rewrites, Opus 5 for Landed (`SHORTLIST_MODEL_*`) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe Checkout, one-time payments in CAD; point the webhook at `/api/billing/webhook` |
| `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | Salary bands and Plan B roles for every Adzuna country (Canada, US, UK, Australia and more). Without keys the pay report says "no reliable data" in production |
| `RESEND_API_KEY`, `EMAIL_FROM`, `FOUNDER_EMAIL` | Delivery emails and human-review notifications |
| `FREE_SCAN_SALT` | Salts the hashed email used for the one-scan-per-7-days limit |

Firebase console, once: enable **Email/Password** and **Google** under Authentication → Sign-in method, add the production domain under Authentication → Settings → Authorized domains, and create the **Firestore** database in Native mode (pick a Canadian region such as `northamerica-northeast2`, Toronto, so resumes stay in Canada). Then deploy the rules and indexes:

```bash
npx firebase login
npx firebase deploy --only firestore
```

`firestore.rules` denies every client read and write: browsers only ever hold a Firebase Auth session, and all data access goes through the server with the Admin SDK. In production, mock AI and dev checkout are ignored no matter what the env says. Vercel caps request bodies at 4.5 MB; the app enforces 5 MB, so lower `maxUploadBytes` in `src/lib/app/config.ts` if you deploy there.

### Deploying

The AI steps are long requests: scoring a posting takes a few seconds, building a package with the live models can take a minute. Pick a host that allows that.

| Host | Fit | Notes |
| --- | --- | --- |
| **Firebase App Hosting** (recommended) | Best | Same Google project as Auth and Firestore, so the server needs no `FIREBASE_SERVICE_ACCOUNT`; long request timeouts. `apphosting.yaml` is in the repo: create a backend, connect the repo, set the secrets it lists |
| Vercel Pro | Good | `maxDuration` on the heavy routes is honoured (up to 300 s). Set every variable from the table above |
| Your own Node server | Good | `npm run build && npm start`; no timeouts to worry about |
| Netlify | Free scan and sign-in only | API routes run as a function with a 10 s limit (26 s on paid plans), so package builds with the live models time out. `netlify.toml` pins Node 22 |

**Free path.** Firebase's Spark plan covers sign-in and Firestore at this stage, and Render's free web service runs the app with no short function timeout. `render.yaml` in the repo is a Render Blueprint: New → Blueprint → this repo, then fill in the secrets it asks for. Free instances sleep after 15 minutes without traffic, so the first visitor after a quiet spell waits half a minute; move to a paid instance or Firebase App Hosting when there is revenue. The Anthropic API itself is pay-per-use (a few cents per package) and needs prepaid credit.

Whatever the host: `GET /api/health` lists the integrations that are live and the variables still missing, and `GET /api/health?check=1` also exercises Firestore and Firebase Auth with the server's credentials and explains any failure in plain words. A blank "Request failed (500)" in the app means the server function itself did not run; the host's function log names the cause, and `src/instrumentation.ts` prints route and error there.

## The product

| Area | Where | What happens |
| --- | --- | --- |
| Free scan | `/scan`, `POST /api/scan` | No account. PDF/DOCX parsed with column detection, profile extracted, posting parsed, deterministic score with published breakdown, red flags. Result stored 7 days (no resume text), emailed, one scan per email per 7 days |
| Sign in | `/sign-in`, `/sign-up`, `/forgot-password` | Firebase Auth: email + password and Google. Required for anything paid |
| Checkout | `/checkout?plan=single|pass|landed` (+ add-ons) | Stripe Checkout session; webhook and success-page confirmation both grant the purchase idempotently. No card is ever stored |
| Dashboard | `/app` | Package status, resume on file, recent applications |
| New application | `/app/applications/new` | Posting + resume (saved profile or new upload) → score, verdict, pay report (Adzuna, in the posting's country and currency), red flags, Plan B |
| Application | `/app/applications/[id]` | Build the package: metric interview (pass and up) → rewrite → every figure validated against the source → rescore → interview prep, objections, LinkedIn. DOCX and PDF generated on demand. Status tracker and notes |
| Resume profile | `/app/profile` | The extracted Candidate Profile with per-bullet figure flags, replace resume, language and city |
| Account | `/app/account` | Purchases, add-ons, sign out, one-click delete of everything (PIPEDA) |

### Markets

The service works for a posting anywhere. `src/lib/app/markets.ts` is the one table that decides what changes by country: the currency of pay data, whether Adzuna covers it, what the region line of an address is called, the paper size of the delivered documents and the spelling the rewrite uses. The posting's country is taken from the posting itself (explicit country, province, state, postcode), then the account's home market, then the resume. Checkout charges Canadian dollars in Canada and US dollars everywhere else; the price table in `src/lib/billing/plans.ts` is per currency, so adding GBP or EUR is one row. The account's home market defaults from the browser locale at sign-up and can be changed on the profile page.

Server code lives in `src/lib`: `pipeline/` orchestrates, `ai/` talks to Claude (with `mock.ts` as the offline stand-in), `scoring/` is the deterministic scorer and red-flag rules, `parse/` reads PDF and DOCX, `documents/` builds DOCX and PDF, `billing/` holds the catalogue, entitlements and Stripe, `store/` is the only code that touches Firestore. Fair-use caps live in `billing/plans.ts` and are enforced server-side, never shown.

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

The hero headline is "Resumes that attract the right jobs." (variant `a`). A second variant, `b` — "Know before you apply." (sells the decision) — stays in `src/lib/content.ts` for a future test; preview it with `?h=b`.

The test is dormant: `HEADLINE_TEST_ENABLED` in `src/lib/headline.ts` is `false`, so every visitor gets variant `a` and nothing is stored. Set it to `true` to run the test: `?h=a` or `?h=b` in the URL wins, then `localStorage` (`sl_headline`), then a coin flip, chosen before first paint. Either way the choice is stamped on `<html data-headline="a|b">` so analytics can read it.

## Things still to decide (from the plan)

- **Name and domain.** Orvenic, at orvenic.com only. Still to do: a mailbox for `hello@orvenic.com` (the address in `content.ts`) and the CIPO and USPTO trademark searches before filing.
- **Legal pages.** `/privacy`, `/terms` and `/refunds` are plain-language drafts written from the business plan. Review them with counsel before launch. Choices made in the drafts that you may want to change: free-scan files deleted within 24 hours, paid files kept for the access period plus 30 days, a 14-day window to claim the guarantee, a 48-hour unused-pass refund, and the fair-use caps (50 and 150 packages) stated in the terms as the plan intends.
- **Browser extension and B2B seats.** Not built yet. Seat purchases can be granted with `source: "seat"` purchases until an intake page exists.
- **Human review and coaching (Landed).** Packages are queued and the founder is emailed (`FOUNDER_EMAIL`); marking a review done is a manual Firestore update for now.
- **Fair-use caps** for the passes live in the terms and are deliberately not shown anywhere in the UI.
- **Payments.** Stripe Checkout is wired for every package and add-on. Before launch: live keys, the webhook endpoint at `/api/billing/webhook`, and decide whether to turn on Stripe Tax (`STRIPE_AUTOMATIC_TAX=1`) for HST.
