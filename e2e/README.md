# End-to-end

`e2e/app.mjs` drives the whole product in a real browser: the free scan API (two-column PDF, rate limit, stored result), sign-up, dev checkout, the dashboard, resume upload and extraction, scoring, the metric interview, the package with figure validation, DOCX and PDF downloads, status tracking, the account page, the marketing navbar's signed-in state, the phone layout, the free-scan form and account deletion. It runs against the Firebase emulators with the deterministic mock AI and the development checkout, so it needs no external account.

```bash
npm run emulators              # terminal 1 (Java 21+)
npx playwright install chromium   # once
npm run e2e                    # terminal 2
```

It starts its own `next dev` on port 3131 (`E2E_PORT` to change). To use a browser you already have, set `E2E_CHANNEL=chrome` or `E2E_CHROMIUM=/path/to/chrome`. Screenshots are written to `e2e/output/` (ignored by git). Fixtures are Maria's illustrative resume as DOCX and as a two-column PDF, plus one posting.

## The browser extension

`e2e/extension.mjs` builds the extension in dev mode (`extension/.dev`, which adds localhost to the allowed hosts), loads it into a persistent Chromium context and runs the whole flow: sign-up, pass, profile, connecting the extension from `/app/extension`, scoring a posting from a page, building the package, filling a Greenhouse look-alike (names, contact, cover letter, resume attached through a hidden input, attestations and self-identification flagged and untouched, pay report beside the salary ask, nothing submitted, undo), the same on Lever and Workday look-alikes, marking the application applied from the popup, and revoking the key. The look-alikes live in `e2e/fixtures/ats/` and are served on `E2E_FIXTURE_PORT` (default 3149); the app runs on `E2E_PORT` (default 3132).

```bash
npm run emulators              # terminal 1
npm run e2e:extension          # terminal 2
```

Extensions need a full Chromium (`E2E_CHROMIUM=/path/to/chrome` or `E2E_CHANNEL=chrome`); the headless shell Playwright downloads by default cannot load them.
