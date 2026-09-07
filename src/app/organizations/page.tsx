import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Organizations from "@/components/Organizations";
import { PilotSteps, WhoItsFor } from "@/components/OrgBlocks";
import Faq from "@/components/Faq";
import CtaBand from "@/components/CtaBand";
import { faqPage, orgPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "For organizations",
  description: "Seat packages for employment agencies, settlement organizations and college career centres. 30-day passes from a white-labelled intake page, with quarterly reporting. Pilots from 25 seats.",
};

const orgFaq = faqPage.categories.find((c) => c.id === "organizations")!;

export default function OrganizationsPage() {
  return (
    <main>
      <PageHero
        eyebrow={orgPage.hero.eyebrow}
        title={orgPage.hero.title}
        lead={orgPage.hero.lead}
        actions={
          <>
            <a className="btn btn--coral btn--lg" href={orgPage.cta.href}>
              {orgPage.cta.label}
            </a>
            <Link className="btn btn--ghost btn--lg" href="#organizations">
              See seat packages
            </Link>
          </>
        }
      />
      <WhoItsFor />
      <Organizations />
      <PilotSteps />
      <section className="section section--tight" aria-labelledby="org-faq-title">
        <div className="wrap">
          <Faq items={orgFaq.items} title={orgFaq.title} compact idPrefix="org-faq" id="org-faq" />
        </div>
      </section>
      <CtaBand
        title="Start with a 25-seat pilot."
        lead="One conversation, one intake page, and your first clients scanning postings within two weeks. Seats stay valid for 12 months."
        primary={orgPage.cta}
        secondary={{ label: "See consumer pricing", href: "/pricing" }}
      />
    </main>
  );
}
