import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Pricing from "@/components/Pricing";
import CompareTable from "@/components/CompareTable";
import Faq from "@/components/Faq";
import CtaBand from "@/components/CtaBand";
import { faqPage, pricingPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free scan, Single Shot $29, 30-Day Pass $99, Landed $299. One-time purchases in Canadian dollars, no subscription, no card on file, and the 85-or-free guarantee.",
};

const pricingFaq = faqPage.categories.find((c) => c.id === "pricing")!;

export default function PricingPage() {
  return (
    <main>
      <PageHero
        eyebrow={pricingPage.hero.eyebrow}
        title={pricingPage.hero.title}
        lead={pricingPage.hero.lead}
        actions={
          <>
            <Link className="btn btn--coral btn--lg" href="/scan">
              Start with the free scan
            </Link>
            <a className="btn btn--ghost btn--lg" href="#compare">
              Compare packages
            </a>
          </>
        }
      />
      <Pricing showHead={false} />
      <CompareTable />
      <section className="section section--tight" aria-labelledby="pricing-faq-title">
        <div className="wrap">
          <Faq items={pricingFaq.items} title={pricingFaq.title} compact idPrefix="pricing-faq" id="pricing-faq" />
        </div>
      </section>
      <CtaBand />
    </main>
  );
}
