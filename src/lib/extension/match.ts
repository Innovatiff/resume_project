/* ------------------------------------------------------------------
   Which saved application does this page belong to? Shared by the
   server (which answers the extension) and the tests.
------------------------------------------------------------------- */

export interface PageRef {
  url?: string;
  title?: string;
}

export interface AppRef {
  url?: string;
  title: string;
  company?: string;
}

/** Host without www plus the path, lowercased, no query, no trailing slash. Empty for anything that is not a URL. */
export function urlKey(url?: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const path = u.pathname.replace(/\/+$/, "").toLowerCase();
    return `${host}${path}`;
  } catch {
    return "";
  }
}

export function hostOf(url?: string): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

const STOP = new Set(["and", "the", "for", "with", "job", "jobs", "career", "careers", "apply", "application", "position", "role", "hiring", "inc", "ltd", "llc"]);

export function tokens(s?: string): string[] {
  if (!s) return [];
  const out = new Set<string>();
  for (const w of s.toLowerCase().split(/[^a-z0-9]+/)) {
    if (w.length >= 3 && !STOP.has(w)) out.add(w);
  }
  return [...out];
}

/** 0 to 100. A saved URL that matches the page is certain; otherwise the title and company have to carry it. */
export function matchScore(page: PageRef, app: AppRef): number {
  const pk = urlKey(page.url);
  const ak = urlKey(app.url);
  if (pk && ak && pk === ak) return 100;
  let score = 0;
  if (pk && ak && hostOf(page.url) === hostOf(app.url)) score += 25;
  const pt = tokens(page.title);
  const at = tokens(app.title);
  if (pt.length && at.length) {
    const hits = at.filter((t) => pt.includes(t)).length;
    score += Math.round((hits / at.length) * 55);
  }
  if (app.company && page.title && page.title.toLowerCase().includes(app.company.toLowerCase())) score += 20;
  return Math.min(100, score);
}

export function bestMatch<T extends AppRef>(apps: T[], page: PageRef, threshold = 45): { app: T; score: number } | null {
  let best: { app: T; score: number } | null = null;
  for (const app of apps) {
    const score = matchScore(page, app);
    if (score >= threshold && (!best || score > best.score)) best = { app, score };
  }
  return best;
}
