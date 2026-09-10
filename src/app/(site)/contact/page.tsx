import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ContactChannels from "@/components/ContactBlocks";
import CtaBand from "@/components/CtaBand";
import { contactPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Contact",
  description: "Email Orvenic about a scan, a delivery, a refund, an organization pilot or a privacy request. A person replies.",
};

export default function ContactPage() {
  return (
    <main>
      <PageHero eyebrow={contactPage.hero.eyebrow} title={contactPage.hero.title} lead={contactPage.hero.lead} tiles={false} />
      <ContactChannels />
      <CtaBand />
    </main>
  );
}
