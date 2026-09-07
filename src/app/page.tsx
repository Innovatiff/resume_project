import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import VerdictCloud from "@/components/VerdictCloud";
import Bento from "@/components/Bento";
import RulesFan from "@/components/RulesFan";
import StoryCarousel from "@/components/StoryCarousel";
import Pricing from "@/components/Pricing";
import Organizations from "@/components/Organizations";
import Faq from "@/components/Faq";
import FreeScan from "@/components/FreeScan";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <VerdictCloud />
        <Bento />
        <RulesFan />
        <StoryCarousel />
        <Pricing />
        <Organizations />
        <Faq />
        <FreeScan />
      </main>
      <Footer />
    </>
  );
}
