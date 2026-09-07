import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter_Tight, Outfit } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import RevealManager from "@/components/RevealManager";
import { headlineBootstrap } from "@/lib/headline";

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
  title: "Shortlist — Know which jobs are worth applying to",
  description,
  applicationName: "Shortlist",
  keywords: ["resume", "ATS score", "job search", "Canada", "Windsor", "salary report", "cover letter"],
  openGraph: {
    title: "Shortlist — Stop applying to 200 jobs.",
    description,
    type: "website",
    locale: "en_CA",
    siteName: "Shortlist",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shortlist — Stop applying to 200 jobs.",
    description,
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
        {children}
        <SmoothScroll />
        <RevealManager />
      </body>
    </html>
  );
}
