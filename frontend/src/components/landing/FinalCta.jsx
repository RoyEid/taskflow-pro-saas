import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import useLandingCta from "./useLandingCta";
import { primaryCta, secondaryCta, ctaPlaceholder } from "./ctaStyles";

function FinalCta() {
  const { ready, primary, secondary } = useLandingCta();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-8 sm:pb-28">
      <Reveal>
        <div className="lp-panel-shadow relative overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-b from-white/90 to-white/60 px-6 py-14 text-center backdrop-blur-xl dark:border-slate-800/60 dark:from-slate-900/90 dark:to-slate-900/50 sm:px-12 sm:py-20">
          {/* Layered ambient glow */}
          <div
            aria-hidden="true"
            className="lp-dot-grid pointer-events-none absolute inset-0 opacity-70"
          />
          <div
            aria-hidden="true"
            className="lp-glow lp-breathe pointer-events-none absolute left-1/2 top-0 h-72 w-[36rem] max-w-full -translate-x-1/2 blur-3xl"
          />

          <div className="relative">
            <h2 className="lp-h2 mx-auto max-w-2xl tf-text">
              Give your next project a{" "}
              <span className="lp-accent-text">single source of truth</span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-[15.5px] leading-relaxed tf-text-secondary">
              Create a workspace, invite your team, and send your first task for
              client approval — all in a few minutes.
            </p>

            <div className="mt-9 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              {!ready ? (
                <span className={`${ctaPlaceholder} h-12 w-full sm:w-48`} aria-hidden="true" />
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
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default FinalCta;
