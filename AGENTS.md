<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project notes

- Marketing landing page for Orvenic. Design language: pale grey page, white rounded panels, ink text, coral / purple / yellow / cyan accents, heavy tight-tracked headlines (Inter Tight) with Outfit body text.
- Brand: Orvenic, at orvenic.com (`brand` in `src/lib/content.ts`). "shortlist" survives only as a common noun ("Your shortlist", the 404 pun); never as the product name.
- All copy, prices and example data live in `src/lib/content.ts`. Change content there, not in components.
- Design tokens are CSS custom properties in `src/app/globals.css`. Components use CSS Modules.
- Motion: GSAP + ScrollTrigger + Lenis. `RevealManager` handles `data-reveal` / `data-reveal-text`; keep new sections working with JS disabled and under `prefers-reduced-motion`.
- Prices are CAD. The pass fair-use caps must never appear in the UI (terms only). Never present illustrative scenarios (Maria) as customer reviews.
- `/api/scan` is the real free scan (multipart: file + posting + email). It runs the same parser and scorer as the paid pipeline, stores no resume text, and rate-limits one scan per hashed email per 7 days.

# Product app notes

- The app lives under `src/app/app` (client UI in `src/components/app`), auth pages under `src/app/(auth)`, checkout under `src/app/(site)/checkout`. The marketing site is `src/app/(site)`.
- All Firestore access is server-side through `src/lib/store/*` with the Admin SDK; `firestore.rules` denies every client read and write. Browsers use Firebase Auth only and send the ID token as `Authorization: Bearer`.
- The Firebase project is `resume-project-56b09`; its public web config is built into `src/lib/firebase/client.ts` (env overrides for staging or the emulators). Google Analytics runs only in production builds via `src/lib/firebase/analytics.ts`; new user-facing data flows need a line in the privacy draft in `src/lib/pages.ts`.
- Route handlers wrap with `withHandler` and throw `ApiError` for user-facing failures. Heavy routes set `maxDuration`.
- `src/lib/pipeline` orchestrates scans and packages; `src/lib/ai/tasks.ts` switches between Claude (`client.ts`, structured outputs via `messages.parse`) and `mock.ts`. Mock AI and dev checkout only work outside `NODE_ENV=production`.
- Markets: `src/lib/app/markets.ts` is the only place that knows about countries (currency, Adzuna coverage, region label, paper, spelling). Checkout is CAD in Canada and USD elsewhere via `PRICES` in `src/lib/billing/plans.ts`. Copy must not assume Canada; Maria's story is the one deliberate Windsor–Essex example.
- Rule 1 is enforced in code: `src/lib/ai/validate.ts` strips any figure not present in the candidate's source or interview answers. Keep it that way.
- Local run: `.env.local.example` + `npm run emulators` + `npm run dev`. Unit tests: `npm test`. End-to-end: `npm run e2e` (Playwright against the emulators, mock AI and dev checkout; see `e2e/README.md`).
