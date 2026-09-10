import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import { Company, RulesGrid, Wedges } from "@/components/AboutBlocks";
import CtaBand from "@/components/CtaBand";
import { aboutPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "About",
  description: "Orvenic is an independent Canadian company serving job seekers in Canada, the US and beyond, built on one idea: fewer, better applications. The three things nobody else will do, and the six rules we never break.",
};

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow={aboutPage.hero.eyebrow}
        title={aboutPage.hero.title}
        lead={aboutPage.hero.lead}
        actions={
          <>
            <Link className="btn btn--ink btn--lg" href="/how-it-works">
              See how it works
            </Link>
            <Link className="btn btn--ghost btn--lg" href="/contact">
              Contact us
            </Link>
          </>
        }
      />
      <Wedges />
      <RulesGrid />
      <Company />
      <CtaBand />
    </main>
  );
}
