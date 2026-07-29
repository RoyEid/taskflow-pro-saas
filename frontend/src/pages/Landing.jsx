import LandingNav from "../components/landing/LandingNav";
import Hero from "../components/landing/Hero";
import FeatureGrid from "../components/landing/FeatureGrid";
import HowItWorks from "../components/landing/HowItWorks";
import Benefits from "../components/landing/Benefits";
import ProductPreview from "../components/landing/ProductPreview";
import FinalCta from "../components/landing/FinalCta";
import LandingFooter from "../components/landing/LandingFooter";

function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-slate-50 dark:bg-slate-950">
      {/* Ambient background wash, shared by every section */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[15%] -top-[25%] h-[65%] w-[65%] rounded-full bg-stone-300/25 blur-[130px] dark:bg-stone-700/15" />
        <div className="lp-glow absolute -right-[10%] top-[8%] h-[55%] w-[55%] rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[45%] w-[60%] rounded-full bg-stone-200/25 blur-[130px] dark:bg-stone-800/20" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <LandingNav />

        <main className="flex-1">
          <Hero />
          <FeatureGrid />
          <HowItWorks />
          <Benefits />
          <ProductPreview />
          <FinalCta />
        </main>

        <LandingFooter />
      </div>
    </div>
  );
}

export default Landing;
