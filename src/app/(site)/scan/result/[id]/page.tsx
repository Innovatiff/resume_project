import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScanResultCard from "@/components/app/ScanResultCard";
import PageHero from "@/components/PageHero";
import { getFreeScanResult } from "@/lib/store/free-scans";

export const metadata: Metadata = { title: "Your scan result", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Page(props: PageProps<"/scan/result/[id]">) {
  const { id } = await props.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const result = await getFreeScanResult(id);
  if (!result) notFound();
  return (
    <main>
      <PageHero eyebrow="Free scan" title={`${result.score.score} out of 100.`} lead={`Your resume against “${result.postingTitle}”. The breakdown is published so you can audit it.`} tiles={false} />
      <section className="section section--tight">
        <div className="wrap" style={{ maxWidth: 900 }}>
          <ScanResultCard result={result} standalone />
        </div>
      </section>
    </main>
  );
}
