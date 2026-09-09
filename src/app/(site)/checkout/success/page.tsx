import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccess } from "@/components/CheckoutPanel";

export const metadata: Metadata = { title: "Purchase complete", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <main>
      <section className="section" style={{ paddingTop: "calc(var(--nav-h) + 80px)" }}>
        <Suspense fallback={null}>
          <CheckoutSuccess />
        </Suspense>
      </section>
    </main>
  );
}
