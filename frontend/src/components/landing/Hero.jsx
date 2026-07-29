import { Link } from "react-router";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import HeroScene from "./hero/HeroScene";
import StatStrip from "./StatStrip";
import useLandingCta from "./useLandingCta";
import { primaryCta, secondaryCta, ctaPlaceholder } from "./ctaStyles";

const trustChips = [
  { icon: Zap, label: "Real-time sync" },
  { icon: ShieldCheck, label: "Verified sign-in" },
];

function Hero() {
  const { ready, primary, secondary } = useLandingCta();

  return (
    <section className="relative lp-container overflow-x-clip pb-8 pt-12 sm:pt-16 lg:pt-20">
      {/* Background texture */}
      <div
        aria-hidden="true"
        className="lp-dot-grid pointer-events-none absolute inset-0 -z-10"
      />

      <div className="mx-auto w-full text-center">
        <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3.5 py-1.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
          <span className="lp-breathe h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span className="text-[12px] font-semibold tf-text-secondary">
            Projects, chat, and client approvals in one place
          </span>
        </div>

        <h1 className="lp-display animate-fade-in-up stagger-1 mt-6 tf-text">
          Ship client work without the{" "}
          <span className="lp-accent-text">status meeting</span>.
        </h1>

        <p className="lp-lead animate-fade-in-up stagger-2 mx-auto mt-5 w-full tf-text-secondary">
          TaskFlow Pro puts your Kanban board, team chat, and client sign-off in
          a single workspace — so progress stays visible without anyone having
          to ask for an update.
        </p>

        <div className="animate-fade-in-up stagger-3 mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          {!ready ? (
            <span className={`${ctaPlaceholder} h-12 w-full sm:w-44`} aria-hidden="true" />
          ) : (
            <>
              <Link to={primary.to} className={`${primaryCta} h-12 w-full sm:w-auto`}>
                {primary.label}
                <ArrowRight
                  size={17}
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                />
              </Link>

              {secondary && (
                <Link
                  to={secondary.to}
                  className={`${secondaryCta} h-12 w-full sm:w-auto`}
                >
                  {secondary.label}
                </Link>
              )}
            </>
          )}
        </div>

        <ul className="animate-fade-in-up stagger-4 mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {trustChips.map((chip) => {
            const Icon = chip.icon;

            return (
              <li
                key={chip.label}
                className="flex items-center gap-1.5 text-[13px] font-medium tf-text-muted"
              >
                <Icon size={14} className="text-amber-600 dark:text-amber-500" />
                {chip.label}
              </li>
            );
          })}
        </ul>
      </div>

      {/* 3D workspace preview */}
      <div className="animate-fade-in-up stagger-5 mt-12 sm:mt-16">
        <HeroScene />
      </div>

      <div className="animate-fade-in-up stagger-5 mx-auto mt-10 max-w-2xl border-t border-slate-200/70 pt-8 dark:border-slate-800/70 sm:mt-14">
        <StatStrip />
      </div>
    </section>
  );
}

export default Hero;
