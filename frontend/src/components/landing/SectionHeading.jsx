import Reveal from "./Reveal";

/* Shared eyebrow + title + description block, so every section keeps the
   same vertical rhythm and type scale. */
function SectionHeading({ eyebrow, title, description, align = "center" }) {
  const isCentered = align === "center";

  return (
    <div className={isCentered ? "mx-auto w-full text-center" : "w-full"}>
      {eyebrow && (
        <Reveal>
          <p className="lp-eyebrow text-amber-700 dark:text-amber-500">{eyebrow}</p>
        </Reveal>
      )}

      <Reveal delay={70}>
        <h2 className="lp-h2 mt-3 tf-text">{title}</h2>
      </Reveal>

      {description && (
        <Reveal delay={140}>
          <p
            className={`mt-4 text-[15px] leading-relaxed tf-text-secondary sm:text-[16.5px] ${
              isCentered ? "mx-auto" : ""
            }`}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}

export default SectionHeading;
