import { useId, useState } from "react";
import { Building2, UserPlus, ClipboardList, Gauge, BadgeCheck } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

/* These steps are a real sequence — each one depends on the previous — so
   numbering them carries information rather than decorating the section. */
const steps = [
  {
    icon: Building2,
    title: "Create a project",
    summary: "Start a workspace for the engagement.",
    detail:
      "Set up a workspace per team or per client, add the project, and pick who owns it. Everything that follows lives inside that boundary.",
    highlight: "Northwind Redesign · created",
  },
  {
    icon: UserPlus,
    title: "Invite your team",
    summary: "Send signed invite links with a role attached.",
    detail:
      "Invitations carry an expiring token and a role. Members get the board and chat; clients get the approvals and progress view only.",
    highlight: "4 members · 1 client invited",
  },
  {
    icon: ClipboardList,
    title: "Assign tasks",
    summary: "Break the work down and give it an owner.",
    detail:
      "Add tasks to the board, set priority and due dates, attach the brief, and assign someone. Assignment notifies them straight away.",
    highlight: "18 tasks · 6 assignees",
  },
  {
    icon: Gauge,
    title: "Track progress",
    summary: "Watch it move without chasing anyone.",
    detail:
      "Cards move across columns in real time and the sprint bar updates with them. Analytics roll the same data into completion rates.",
    highlight: "Sprint 14 · 72% complete",
  },
  {
    icon: BadgeCheck,
    title: "Get client approval",
    summary: "Close the loop where the work lives.",
    detail:
      "Send a task for sign-off. The client approves or comments in their portal, and the decision stays attached to the task with a timestamp.",
    highlight: "Homepage motion pass · approved",
  },
];

function HowItWorks() {
  const [activeIndex, setActiveIndex] = useState(0);
  const baseId = useId();
  const activeStep = steps[activeIndex];
  const ActiveIcon = activeStep.icon;

  return (
    <section
      id="how-it-works"
      className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 sm:px-8 sm:py-28"
    >
      <SectionHeading
        eyebrow="How it works"
        title="From kickoff to sign-off"
        description="Five steps, in the order they actually happen. Pick one to see what it looks like."
      />

      <div className="mt-14 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-10">
        {/* Step selector */}
        <Reveal>
          <ol
            role="tablist"
            aria-label="Workflow steps"
            className="flex flex-col gap-2"
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === activeIndex;

              return (
                <li key={step.title}>
                  <button
                    type="button"
                    role="tab"
                    id={`${baseId}-tab-${index}`}
                    aria-selected={isActive}
                    aria-controls={`${baseId}-panel-${index}`}
                    onClick={() => setActiveIndex(index)}
                    className={`flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 sm:gap-4 ${
                      isActive
                        ? "border-amber-500/40 bg-white shadow-lg shadow-stone-900/5 dark:border-amber-500/30 dark:bg-slate-900 dark:shadow-black/30"
                        : "border-transparent bg-white/50 hover:border-slate-200 hover:bg-white/80 dark:bg-slate-900/40 dark:hover:border-slate-800 dark:hover:bg-slate-900/70"
                    }`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                        isActive
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      <Icon size={18} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-2">
                        <span className="lp-tabular text-[11px] font-bold text-amber-700 dark:text-amber-500">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[15px] font-bold tf-text">
                          {step.title}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[13.5px] leading-relaxed tf-text-muted">
                        {step.summary}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </Reveal>

        {/* Active step detail */}
        <Reveal delay={120} className="lg:sticky lg:top-24 lg:self-start">
          <div
            role="tabpanel"
            id={`${baseId}-panel-${activeIndex}`}
            aria-labelledby={`${baseId}-tab-${activeIndex}`}
            className="lp-panel-shadow relative overflow-hidden rounded-3xl border border-white/50 bg-white/80 p-7 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70 sm:p-9"
          >
            <div
              aria-hidden="true"
              className="lp-glow pointer-events-none absolute -right-16 -top-16 h-56 w-56"
            />

            <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-600/25">
              <ActiveIcon size={24} />
            </span>

            <p className="lp-tabular relative mt-6 text-[11px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-500">
              Step {String(activeIndex + 1).padStart(2, "0")} of{" "}
              {String(steps.length).padStart(2, "0")}
            </p>

            <h3 className="relative mt-2 text-2xl font-extrabold tracking-tight tf-text">
              {activeStep.title}
            </h3>

            <p className="relative mt-3 text-[15px] leading-relaxed tf-text-secondary">
              {activeStep.detail}
            </p>

            <div className="relative mt-7 flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/50">
              <span className="lp-breathe h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
              <span className="truncate text-[13px] font-semibold tf-text-secondary">
                {activeStep.highlight}
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default HowItWorks;
