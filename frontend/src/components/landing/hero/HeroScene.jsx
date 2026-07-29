import BoardPanel from "./BoardPanel";
import AnalyticsCard from "./AnalyticsCard";
import ApprovalCard from "./ApprovalCard";
import NotificationToast from "./NotificationToast";
import useTilt from "../useTilt";

/* The hero's 3D composition.

   The stage is authored at a fixed 940x600 and scaled per breakpoint by
   .lp-scene, so the layered composition holds together at every width
   instead of reflowing. Each layer nests its translateZ on an outer node
   and its float animation on an inner node, so the two transforms don't
   overwrite each other. */
function HeroScene() {
  const { areaRef, stageRef } = useTilt();

  return (
    <div
      ref={areaRef}
      className="lp-scene-frame relative w-full"
      role="img"
      aria-label="A TaskFlow Pro workspace: a Kanban board for the Northwind Redesign project with tasks in To do, In progress and Review, alongside a completed-tasks chart, a client approval request, and a live notification."
    >
      {/* Ambient glow behind the scene */}
      <div
        aria-hidden="true"
        className="lp-glow lp-breathe pointer-events-none absolute left-1/2 top-[8%] h-[70%] w-[85%] -translate-x-1/2 blur-3xl"
      />

      <div className="lp-scene absolute left-1/2 top-0 -translate-x-1/2" aria-hidden="true">
        <div ref={stageRef} className="lp-stage relative h-full w-full">
          {/* Main board */}
          <div
            className="lp-layer absolute"
            style={{ left: 10, top: 96, width: 626, height: 352 }}
          >
            <div className="lp-float-a h-full w-full">
              <BoardPanel />
            </div>
          </div>

          {/* Analytics, lifted forward and clear of the board's text */}
          <div
            className="lp-layer absolute"
            style={{ left: 656, top: 100, width: 274, transform: "translateZ(70px)" }}
          >
            <div className="lp-float-b">
              <AnalyticsCard />
            </div>
          </div>

          {/* Client approval, furthest forward, landing over the sparse
              Review column rather than across any label */}
          <div
            className="lp-layer absolute"
            style={{ left: 590, top: 322, width: 322, transform: "translateZ(115px)" }}
          >
            <div className="lp-float-c">
              <ApprovalCard />
            </div>
          </div>

          {/* Live notification */}
          <div
            className="lp-layer absolute"
            style={{ left: 8, top: 16, width: 288, transform: "translateZ(140px)" }}
          >
            <div className="lp-float-b">
              <NotificationToast />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroScene;
