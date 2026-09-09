import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import { notFoundPage } from "@/lib/pages";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main>
        <PageHero
          eyebrow={notFoundPage.eyebrow}
          title={notFoundPage.title}
          lead={notFoundPage.lead}
          actions={
            <>
              {notFoundPage.links.map((l, i) => (
                <Link key={l.href} className={`btn ${i === 0 ? "btn--ink" : "btn--ghost"}`} href={l.href}>
                  {l.label}
                </Link>
              ))}
            </>
          }
        />
      </main>
      <Footer />
    </>
  );
}
