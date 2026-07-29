import { Link } from "react-router";
import BrandLogo from "../ui/BrandLogo";
import useLandingCta from "./useLandingCta";

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Benefits", href: "#benefits" },
];

function LandingFooter() {
  const { ready, primary, secondary } = useLandingCta();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/70 dark:border-slate-800/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-8 sm:py-14">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <BrandLogo size="sm" />
              <span className="text-[15px] font-extrabold tracking-tight tf-text">
                TaskFlow Pro
              </span>
            </div>

            <p className="mt-3.5 text-[13.5px] leading-relaxed tf-text-muted">
              Project management and a client portal in one workspace.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-16">
            <nav aria-labelledby="footer-product">
              <h2
                id="footer-product"
                className="text-[12px] font-bold uppercase tracking-wider tf-text"
              >
                Product
              </h2>

              <ul className="mt-4 flex flex-col gap-2.5">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-[13.5px] text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-labelledby="footer-account">
              <h2
                id="footer-account"
                className="text-[12px] font-bold uppercase tracking-wider tf-text"
              >
                Account
              </h2>

              <ul className="mt-4 flex flex-col gap-2.5">
                {ready && (
                  <>
                    <li>
                      <Link
                        to={primary.to}
                        className="text-[13.5px] text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                      >
                        {primary.label}
                      </Link>
                    </li>

                    {secondary && (
                      <li>
                        <Link
                          to={secondary.to}
                          className="text-[13.5px] text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                        >
                          {secondary.label}
                        </Link>
                      </li>
                    )}
                  </>
                )}
              </ul>
            </nav>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-200/70 pt-6 dark:border-slate-800/70">
          <p className="text-[12.5px] tf-text-subtle">
            &copy; {year} TaskFlow Pro
          </p>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
