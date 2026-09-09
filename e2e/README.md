# End-to-end

`e2e/app.mjs` drives the whole product in a real browser: the free scan API (two-column PDF, rate limit, stored result), sign-up, dev checkout, the dashboard, resume upload and extraction, scoring, the metric interview, the package with figure validation, DOCX and PDF downloads, status tracking, the account page, the marketing navbar's signed-in state, the phone layout, the free-scan form and account deletion. It runs against the Firebase emulators with the deterministic mock AI and the development checkout, so it needs no external account.

```bash
npm run emulators              # terminal 1 (Java 21+)
npx playwright install chromium   # once
npm run e2e                    # terminal 2
```

It starts its own `next dev` on port 3131 (`E2E_PORT` to change). To use a browser you already have, set `E2E_CHANNEL=chrome` or `E2E_CHROMIUM=/path/to/chrome`. Screenshots are written to `e2e/output/` (ignored by git). Fixtures are Maria's illustrative resume as DOCX and as a two-column PDF, plus one posting.
