import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import CtaBand from "@/components/CtaBand";
import { faqPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Plain answers about the guarantee, refunds, privacy, how the AI is kept honest, languages, and how organization seats work.",
};

export default function FaqPage() {
  return (
    <main>
      <PageHero
        eyebrow={faqPage.hero.eyebrow}
        title={faqPage.hero.title}
        lead={faqPage.hero.lead}
        actions={
          <>
            {faqPage.categories.map((c) => (
              <a key={c.id} className="btn btn--ghost" href={`#${c.id}`}>
                {c.title}
              </a>
            ))}
          </>
        }
      />
      <section className="section" aria-label="Frequently asked questions">
        <div className="wrap">
          {faqPage.categories.map((c) => (
            <Faq key={c.id} items={c.items} title={c.title} compact idPrefix={`faq-${c.id}`} id={c.id} initialOpen={-1} />
          ))}
        </div>
      </section>
      <CtaBand
        title="Still have a question?"
        lead="Email us and a person replies. Same-day for Landed customers, within two business days for everyone else."
        primary={{ label: "Contact us", href: "/contact" }}
        secondary={{ label: "Start the free scan", href: "/scan" }}
      />
      <span className="sr-only">
        <Link href="/">Home</Link>
      </span>
    </main>
  );
}
