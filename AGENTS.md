<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project notes

- Marketing landing page for Shortlist. Design language: pale grey page, white rounded panels, ink text, coral / purple / yellow / cyan accents, heavy tight-tracked headlines (Inter Tight) with Outfit body text.
- All copy, prices and example data live in `src/lib/content.ts`. Change content there, not in components.
- Design tokens are CSS custom properties in `src/app/globals.css`. Components use CSS Modules.
- Motion: GSAP + ScrollTrigger + Lenis. `RevealManager` handles `data-reveal` / `data-reveal-text`; keep new sections working with JS disabled and under `prefers-reduced-motion`.
- Prices are CAD. The pass fair-use caps must never appear in the UI (terms only). Never present illustrative scenarios (Maria) as customer reviews.
- `/api/scan` is a validated stub returning 501 until the scoring pipeline is connected.
