import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import BrandLogo from "../ui/BrandLogo";
import useTheme from "../../context/useTheme";
import useLandingCta from "./useLandingCta";
import { primaryCta, ghostCta, ctaPlaceholder, iconButton } from "./ctaStyles";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Benefits", href: "#benefits" },
];

function LandingNav() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { ready, primary, secondary } = useLandingCta();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled || isMenuOpen
          ? "border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-8">
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="TaskFlow Pro home"
        >
          <BrandLogo size="sm" />
          <span className="text-[15px] font-extrabold tracking-tight tf-text">
            TaskFlow Pro
          </span>
        </Link>

        {/* Desktop links */}
        <div className="ml-4 hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative rounded-lg px-3 py-2 text-[14px] font-medium text-slate-600 transition-colors after:absolute after:bottom-1 after:left-3 after:h-px after:w-0 after:bg-amber-500 after:transition-all after:duration-300 hover:text-slate-900 hover:after:w-[calc(100%-1.5rem)] dark:text-slate-400 dark:hover:text-slate-100"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            className={`${iconButton} touch-target h-10 w-10`}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Responsive visibility lives on wrappers: the CTA class strings
              already set `display`, so combining them with `hidden` would
              leave two display utilities fighting over stylesheet order. */}
          <div className="hidden items-center gap-2 sm:flex">
            {!ready ? (
              <span className={`${ctaPlaceholder} h-10 w-28`} aria-hidden="true" />
            ) : (
              <>
                {secondary && (
                  <Link to={secondary.to} className={`${ghostCta} h-10`}>
                    {secondary.label}
                  </Link>
                )}

                <Link to={primary.to} className={`${primaryCta} h-10`}>
                  {primary.label}
                </Link>
              </>
            )}
          </div>

          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              aria-controls="landing-mobile-menu"
              className={`${iconButton} touch-target h-10 w-10`}
            >
              {isMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="landing-mobile-menu"
        hidden={!isMenuOpen}
        className="border-t border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/95 lg:hidden"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-5 py-4 sm:px-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="touch-target flex items-center rounded-lg px-3 py-3 text-[15px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/70"
            >
              {link.label}
            </a>
          ))}

          {ready && (
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-200/80 pt-4 dark:border-slate-800/80 sm:hidden">
              {secondary && (
                <Link
                  to={secondary.to}
                  onClick={() => setIsMenuOpen(false)}
                  className="touch-target flex h-11 items-center justify-center rounded-xl border border-slate-300/80 text-[14px] font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  {secondary.label}
                </Link>
              )}

              <Link
                to={primary.to}
                onClick={() => setIsMenuOpen(false)}
                className={`${primaryCta} h-11 w-full`}
              >
                {primary.label}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default LandingNav;
