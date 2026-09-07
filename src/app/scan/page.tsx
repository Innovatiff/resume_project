import type { Metadata } from "next";
import FreeScan from "@/components/FreeScan";
import { ScanGets, ScanSteps } from "@/components/ScanBlocks";
import Faq from "@/components/Faq";
import { faqPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Free scan",
  description: "Your ATS score for one resume against one job posting, and the three specific reasons you are being filtered out. No card, no account, under five minutes.",
};

const privacyFaq = faqPage.categories.find((c) => c.id === "privacy")!;

export default function ScanPage() {
  return (
    <main>
      <FreeScan first />
      <ScanSteps />
      <ScanGets />
      <section className="section section--tight" aria-labelledby="scan-faq-title">
        <div className="wrap">
          <Faq items={privacyFaq.items} title={privacyFaq.title} compact idPrefix="scan-faq" id="scan-faq" />
        </div>
      </section>
    </main>
  );
}
