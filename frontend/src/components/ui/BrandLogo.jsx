/**
 * BrandLogo — Reusable TaskFlow Pro logo component.
 * Renders the real favicon.png icon at configurable sizes.
 * Used on Login, Register, VerifyEmail, mobile header, etc.
 */
export default function BrandLogo({ size = "md", className = "" }) {
  const dimensions = {
    sm: "h-8 w-8",      // 32px — mobile header
    md: "h-10 w-10",    // 40px — general use
    lg: "h-12 w-12",    // 48px — auth mobile
    xl: "h-14 w-14",    // 56px — auth desktop
  };

  const imgSize = dimensions[size] || dimensions.md;

  return (
    <img
      src="/favicon.png"
      alt="TaskFlow Pro"
      className={`${imgSize} object-contain ${className}`}
      draggable={false}
    />
  );
}
