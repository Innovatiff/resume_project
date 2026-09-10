import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { legal } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The agreement between you and Orvenic: packages and access periods, fair use, the guarantee, the browser extension, and acceptable use.",
};

export default function Page() {
  return (
    <main>
      <LegalPage doc={legal.terms} current="/terms" />
    </main>
  );
}
