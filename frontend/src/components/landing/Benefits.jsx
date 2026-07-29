import { Layers, Rocket, Target, MessageSquare } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const benefits = [
  {
    icon: Layers,
    title: "Better organization",
    description:
      "Projects, tasks, files, and conversations sit inside one workspace, so nothing lives in a private inbox.",
  },
  {
    icon: Rocket,
    title: "Faster delivery",
    description:
      "Blockers surface on the board instead of in a weekly call, and approvals stop waiting on someone to chase them.",
  },
  {
    icon: Target,
    title: "Clear accountability",
    description:
      "Every task has one owner, a due date, and a visible state. Roles make it obvious who decides what.",
  },
  {
    icon: MessageSquare,
    title: "Centralized collaboration",
    description:
      "Team chat and client sign-off run through the same workspace, so context never has to be reconstructed.",
  },
];

function Benefits() {
  return (
    <section
      id="benefits"
      className="relative scroll-mt-24 border-y border-slate-200/70 bg-white/50 py-20 backdrop-blur-sm dark:border-slate-800/70 dark:bg-slate-900/30 sm:py-28"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        <SectionHeading
          eyebrow="Benefits"
          title="What changes once it's all in one place"
          description="The point isn't more software. It's fewer places to look."
        />

        <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 sm:mt-16 sm:grid-cols-2 sm:gap-y-12">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;

            return (
              <Reveal
                key={benefit.title}
                delay={(index % 2) * 100}
                className="flex gap-4 sm:gap-5"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-50 to-white text-amber-700 shadow-sm dark:border-amber-500/20 dark:from-amber-500/10 dark:to-slate-900 dark:text-amber-400">
                  <Icon size={21} />
                </span>

                <div className="min-w-0">
                  <h3 className="text-[17px] font-bold tf-text">
                    {benefit.title}
                  </h3>
                  <p className="mt-2 text-[14.5px] leading-relaxed tf-text-secondary">
                    {benefit.description}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Benefits;
