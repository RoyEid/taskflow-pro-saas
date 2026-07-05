import { Link } from "react-router";
import BrandLogo from "../components/ui/BrandLogo";

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-slate-950 sm:px-6 lg:px-8">
      {/* Decorative gradient background */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[30%] h-[70%] w-[70%] rounded-full bg-indigo-400/20 blur-[120px] dark:bg-indigo-600/20" />
        <div className="absolute -right-[10%] top-[20%] h-[60%] w-[60%] rounded-full bg-violet-400/20 blur-[120px] dark:bg-violet-600/20" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header / Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/" className="group flex flex-col items-center">
            <div className="flex items-center justify-center rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-105 group-hover:shadow-indigo-500/25">
              <BrandLogo size="xl" className="hidden sm:block" />
              <BrandLogo size="lg" className="block sm:hidden" />
            </div>

            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
          </Link>

          {subtitle && (
            <p className="mt-2.5 text-[15px] text-slate-500 dark:text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {/* Glass Card */}
        <div className="overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-5 shadow-2xl backdrop-blur-xl transition-all dark:border-slate-800/60 dark:bg-slate-900/70 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;