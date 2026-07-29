import { Users, Clock } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import Avatar from "./hero/Avatar";
import AnalyticsCard from "./hero/AnalyticsCard";
import ApprovalCard from "./hero/ApprovalCard";
import NotificationToast from "./hero/NotificationToast";

const projects = [
  { name: "Northwind Redesign", client: "Northwind", progress: 72, state: "On track" },
  { name: "Q3 Campaign Site", client: "Meridian Co.", progress: 45, state: "In review" },
  { name: "Mobile App Handoff", client: "Alto Labs", progress: 91, state: "On track" },
];

const stateStyles = {
  "On track": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "In review": "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
};

function ProjectListCard() {
  return (
    <div className="h-full rounded-2xl border border-white/50 bg-white/85 p-5 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold tf-text">
          Active projects
        </h3>
        <span className="lp-tabular rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          3
        </span>
      </div>

      <ul className="mt-5 flex flex-col gap-4">
        {projects.map((project) => (
          <li key={project.name}>
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="text-[13.5px] font-semibold tf-text">
                {project.name}
              </span>
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                  stateStyles[project.state]
                }`}
              >
                {project.state}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-amber-400"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <span className="lp-tabular w-9 shrink-0 text-right text-[11.5px] font-bold tf-text-muted">
                {project.progress}%
              </span>
            </div>

            <p className="mt-1 text-[11.5px] font-medium tf-text-subtle">
              {project.client}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TeamCard() {
  const members = ["Lina Chatti", "Omar Nasser", "Rana Haddad", "Sami Kabbani", "Dina Aoun"];

  return (
    <div className="flex h-full flex-col justify-between rounded-2xl border border-white/50 bg-white/85 p-5 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80 sm:p-6">
      <div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Users size={18} />
        </span>

        <h3 className="mt-4 text-[14px] font-bold tf-text">
          Workspace team
        </h3>
        <p className="mt-1 text-[12.5px] leading-relaxed tf-text-muted">
          Members, admins, and one client with portal access.
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex -space-x-2">
          {members.map((member) => (
            <Avatar key={member} name={member} size={30} ring />
          ))}
        </div>

        <span className="flex items-center gap-1.5 text-[11.5px] font-semibold tf-text-muted">
          <Clock size={13} />
          Live
        </span>
      </div>
    </div>
  );
}

/* A flat, fully responsive composition of the same surfaces used in the
   hero scene — the product shown straight-on rather than in perspective. */
function ProductPreview() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-8 sm:py-28">
      <SectionHeading
        eyebrow="Inside the workspace"
        title="One screen, the whole engagement"
        description="Progress, people, analytics, and the client's decision — without switching tools to find any of it."
      />

      <Reveal className="relative mt-14 sm:mt-16">
        <div
          aria-hidden="true"
          className="lp-glow pointer-events-none absolute left-1/2 top-1/4 h-[60%] w-[80%] -translate-x-1/2 blur-3xl"
        />

        <div className="lp-panel-shadow relative rounded-3xl border border-white/50 bg-white/40 p-4 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/40 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="md:col-span-3 lg:col-span-2">
              <ProjectListCard />
            </div>

            <div className="md:col-span-3 lg:col-span-2">
              <AnalyticsCard />
            </div>

            <div className="md:col-span-3 lg:col-span-2">
              <ApprovalCard />
            </div>

            <div className="md:col-span-3 lg:col-span-4">
              <TeamCard />
            </div>

            <div className="flex items-center md:col-span-3 lg:col-span-2">
              <NotificationToast />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default ProductPreview;
