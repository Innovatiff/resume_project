import type { Metadata } from "next";
import { Suspense } from "react";
import PageHero from "@/components/PageHero";
import { CheckoutPanel } from "@/components/CheckoutPanel";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <main>
      <PageHero eyebrow="Checkout" title="Pay once. Keep the files." lead="One-time purchase in Canadian dollars. No subscription, no auto-renew, no card kept on file." tiles={false} />
      <section className="section section--tight">
        <Suspense fallback={null}>
          <CheckoutPanel />
        </Suspense>
      </section>
    </main>
  );
}
