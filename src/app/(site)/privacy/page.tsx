import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { legal } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Shortlist collects, why, how long it is kept, and how to delete it. Written in plain language, for Canada, the US and everywhere else we serve.",
};

export default function Page() {
  return (
    <main>
      <LegalPage doc={legal.privacy} current="/privacy" />
    </main>
  );
}
