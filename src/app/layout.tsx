import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter_Tight, Outfit } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./app/app.css";
import "@/components/auth/auth.css";
import SmoothScroll from "@/components/SmoothScroll";
import RevealManager from "@/components/RevealManager";
import Analytics from "@/components/Analytics";
import { AuthProvider } from "@/lib/app/auth-client";
import { headlineBootstrap } from "@/lib/headline";
import { siteUrl } from "@/lib/site";

const display = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const body = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const description =
  "Orvenic tells job seekers which postings are worth applying to, what those roles actually pay in their city, and rewrites the resume for the ones that pass. Canada, the US and beyond. Under five minutes. One-time purchase, no subscription.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // Google Search Console ownership of orvenic.com (the same token as the DNS TXT record).
  verification: { google: "Bj1cvabK4DjkLSWzrkxHrTeIjJDgOQec1ddTwEeJN_Y" },
  title: {
    default: "Orvenic — Know which jobs are worth applying to",
    template: "%s · Orvenic",
  },
  description,
  applicationName: "Orvenic",
  keywords: ["resume", "ATS score", "job search", "Canada", "United States", "Windsor", "salary report", "cover letter"],
  openGraph: {
    title: "Orvenic — Resumes that attract the right jobs.",
    description,
    type: "website",
    locale: "en_CA",
    siteName: "Orvenic",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Orvenic: resumes that attract the right jobs." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Orvenic — Resumes that attract the right jobs.",
    description,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f1f1f4",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>
        {/* Picks the headline variant and marks JS-enabled before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: headlineBootstrap }} />
        <AuthProvider>{children}</AuthProvider>
        <SmoothScroll />
        <RevealManager />
        <Analytics />
      </body>
    </html>
  );
}
