/** Canonical site origin. Set NEXT_PUBLIC_SITE_URL in production; the domain is still an open decision. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://shortlist.ca").replace(/\/$/, "");

export const routes = ["/", "/how-it-works", "/pricing", "/organizations", "/about", "/faq", "/scan", "/contact", "/privacy", "/terms", "/refunds"] as const;
