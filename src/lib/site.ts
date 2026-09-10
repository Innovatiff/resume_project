/** Canonical site origin. NEXT_PUBLIC_SITE_URL overrides it (staging, preview deploys). */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://orvenic.com").replace(/\/$/, "");

export const routes = ["/", "/how-it-works", "/pricing", "/organizations", "/about", "/faq", "/scan", "/contact", "/privacy", "/terms", "/refunds"] as const;
