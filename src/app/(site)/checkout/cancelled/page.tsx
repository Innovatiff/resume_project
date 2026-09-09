import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = { title: "Checkout cancelled", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <main>
      <PageHero
        eyebrow="Checkout"
        title="No charge was made."
        lead="You closed the payment page before finishing. Nothing was stored. Come back whenever you are ready."
        tiles={false}
        actions={
          <>
            <Link className="btn btn--ink btn--lg" href="/pricing">
              Back to pricing
            </Link>
            <Link className="btn btn--ghost btn--lg" href="/scan">
              Try the free scan
            </Link>
          </>
        }
      />
    </main>
  );
}
