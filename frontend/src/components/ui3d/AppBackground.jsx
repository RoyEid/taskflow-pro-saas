/* Ambient backdrop shared by every screen: drifting auroras, a masked
   grid, and film grain. Purely decorative and pointer-transparent.

   Motion is transform-only on two blurred blobs — the whole thing is
   removed on low-capability devices by the CSS layer. */
function AppBackground({ variant = "app" }) {
  const isMarketing = variant === "marketing";

  return (
    <div className="tf-ambient" aria-hidden="true">
      <div className="tf-grid" />

      <div
        className="tf-aurora tf-drift-a"
        style={{
          left: isMarketing ? "-12%" : "-18%",
          top: isMarketing ? "-18%" : "-24%",
          width: isMarketing ? "62%" : "52%",
          height: isMarketing ? "62%" : "52%",
          background:
            "radial-gradient(circle, rgba(217,119,6,0.20) 0%, rgba(217,119,6,0) 70%)",
        }}
      />

      <div
        className="tf-aurora tf-drift-b"
        style={{
          right: "-14%",
          top: isMarketing ? "6%" : "-10%",
          width: "54%",
          height: "54%",
          background:
            "radial-gradient(circle, rgba(120,113,108,0.28) 0%, rgba(120,113,108,0) 70%)",
        }}
      />

      <div
        className="tf-aurora tf-drift-a"
        style={{
          left: "24%",
          bottom: "-24%",
          width: "58%",
          height: "50%",
          animationDelay: "-12s",
          background:
            "radial-gradient(circle, rgba(168,162,158,0.22) 0%, rgba(168,162,158,0) 70%)",
        }}
      />

      <div className="tf-noise" />
    </div>
  );
}

export default AppBackground;
