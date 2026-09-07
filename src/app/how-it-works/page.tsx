import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import ProcessTimeline from "@/components/ProcessTimeline";
import Bento from "@/components/Bento";
import StoryCarousel from "@/components/StoryCarousel";
import CtaBand from "@/components/CtaBand";
import { processPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "How it works",
  description: "Paste a posting, upload your resume, and get a verdict in under five minutes. The seven steps between upload and delivery, and a customer walkthrough end to end.",
};

export default function HowItWorksPage() {
  return (
    <main>
      <PageHero
        eyebrow={processPage.hero.eyebrow}
        title={processPage.hero.title}
        lead={processPage.hero.lead}
        actions={
          <>
            <Link className="btn btn--coral btn--lg" href="/scan">
              Scan my resume free
            </Link>
            <Link className="btn btn--ghost btn--lg" href="/pricing">
              See pricing
            </Link>
          </>
        }
      />
      <ProcessTimeline />
      <Bento />
      <StoryCarousel />
      <CtaBand />
    </main>
  );
}
