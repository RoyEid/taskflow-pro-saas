/* Shared call-to-action styling for the landing page.

   Extends the button conventions used on the auth screens with the
   landing page's depth and micro-interaction treatment. Focus rings are
   explicit so keyboard users get a visible target in both themes. */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-950";

/* Light mode keeps the app's near-black button. In dark mode the remapped
   indigo token resolves to a mid stone grey, which reads muddy on the
   near-black page, so the landing CTA inverts to white instead. */
export const primaryCta =
  `group inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-[14px] font-semibold text-white shadow-lg shadow-stone-900/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-stone-900/25 active:translate-y-0 active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:shadow-black/50 dark:hover:bg-slate-100 ${focusRing}`;

export const secondaryCta =
  `group inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300/80 bg-white/80 px-5 text-[14px] font-semibold text-slate-700 backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-white hover:shadow-lg hover:shadow-stone-900/10 active:translate-y-0 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800 ${focusRing}`;

export const ghostCta =
  `inline-flex items-center justify-center rounded-lg px-3 text-[14px] font-semibold text-slate-700 transition-colors duration-200 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10 ${focusRing}`;

export const ctaPlaceholder =
  "inline-flex animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/70";

export const iconButton =
  `inline-flex items-center justify-center rounded-lg text-slate-500 transition-colors duration-200 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100 ${focusRing}`;
