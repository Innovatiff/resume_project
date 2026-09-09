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
  "Shortlist tells Canadian job seekers which postings are worth applying to, what those roles actually pay in their city, and rewrites the resume for the ones that pass. Under five minutes. One-time purchase, no subscription.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Shortlist — Know which jobs are worth applying to",
    template: "%s · Shortlist",
  },
  description,
  applicationName: "Shortlist",
  keywords: ["resume", "ATS score", "job search", "Canada", "Windsor", "salary report", "cover letter"],
  openGraph: {
    title: "Shortlist — Stop applying to 200 jobs.",
    description,
    type: "website",
    locale: "en_CA",
    siteName: "Shortlist",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Shortlist: stop applying to 200 jobs." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shortlist — Stop applying to 200 jobs.",
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
    <html lang="en-CA" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
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
