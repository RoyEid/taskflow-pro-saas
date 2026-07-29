import {
  SquareKanban,
  MessageSquare,
  ShieldCheck,
  BadgeCheck,
  BarChart3,
  Paperclip,
  Bell,
  Search,
} from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const features = [
  {
    icon: SquareKanban,
    title: "Kanban boards",
    description:
      "Drag work across columns, set priorities and due dates, and see where a project actually stands.",
  },
  {
    icon: MessageSquare,
    title: "Team collaboration",
    description:
      "Workspace chat runs over WebSockets, so discussion happens next to the task instead of in another tab.",
  },
  {
    icon: ShieldCheck,
    title: "Roles and permissions",
    description:
      "Owner, Admin, Member, and Client each see exactly what they should — nothing more.",
  },
  {
    icon: BadgeCheck,
    title: "Client approvals",
    description:
      "Send work for sign-off and keep the decision, the date, and the comments attached to the task.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Track completion rates and workspace activity, then export a formatted PDF when a client asks.",
  },
  {
    icon: Paperclip,
    title: "File attachments",
    description:
      "Keep briefs, mockups, and deliverables on the task they belong to instead of in an email thread.",
  },
  {
    icon: Bell,
    title: "Notifications",
    description:
      "In-app alerts for assignments and status changes, plus transactional email for invites and verification.",
  },
  {
    icon: Search,
    title: "Global search",
    description:
      "Jump to any project, task, or teammate from anywhere with the command palette.",
  },
];

function FeatureGrid() {
  return (
    <section
      id="features"
      className="relative mx-auto w-full max-w-6xl scroll-mt-24 px-4 py-16 sm:px-8 sm:py-28"
    >
      <SectionHeading
        eyebrow="Features"
        title="Everything a client project needs"
        description="Built for teams that answer to someone outside the building — not just to a backlog."
      />

      <div className="mt-12 mx-auto w-full text-left sm:mt-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Reveal
                key={feature.title}
                as="article"
                delay={(index % 4) * 80}
                className="group h-full rounded-2xl border border-white/50 bg-white/70 p-5 text-left shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/30 hover:shadow-xl hover:shadow-stone-900/10 dark:border-slate-800/60 dark:bg-slate-900/60 dark:hover:border-amber-500/25 dark:hover:shadow-black/40"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors duration-300 group-hover:bg-amber-100 group-hover:text-amber-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-amber-500/15 dark:group-hover:text-amber-300">
                  <Icon size={20} />
                </span>

                <h3 className="mt-4 text-[16px] font-bold text-left tf-text">
                  {feature.title}
                </h3>

                <p className="mt-2 text-[14px] leading-relaxed text-left tf-text-secondary">
                  {feature.description}
                </p>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeatureGrid;
