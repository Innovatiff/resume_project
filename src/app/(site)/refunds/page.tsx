import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { legal } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "85 or it's free. How the guarantee works, how to claim a refund, and what is not covered.",
};

export default function Page() {
  return (
    <main>
      <LegalPage doc={legal.refunds} current="/refunds" />
    </main>
  );
}
