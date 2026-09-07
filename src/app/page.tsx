import Hero from "@/components/Hero";
import VerdictCloud from "@/components/VerdictCloud";
import Bento from "@/components/Bento";
import RulesFan from "@/components/RulesFan";
import { OrgTeaser, PricingTeaser } from "@/components/Teasers";
import CtaBand from "@/components/CtaBand";

export default function Home() {
  return (
    <main>
      <Hero />
      <VerdictCloud />
      <Bento />
      <RulesFan />
      <PricingTeaser />
      <OrgTeaser />
      <CtaBand />
    </main>
  );
}
