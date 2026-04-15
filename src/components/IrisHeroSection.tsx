"use client";

// Client wrapper for the homepage hero Iris + mobile ApertureStrip.
// Holds the IrisHandle ref and wires it to the strip so touch events drive
// the iris imperatively without causing React re-renders on every frame.
//
// Hidden on md+ screens where mouse interaction is already present.

import { useRef } from "react";
import Iris, { type IrisHandle } from "@/components/Iris";
import ApertureStrip from "@/components/ApertureStrip";
import { IRIS_HERO } from "@/config/iris-config";

export default function IrisHeroSection() {
  const irisRef = useRef<IrisHandle>(null);

  // Show the strip after the init animation has settled, plus a short grace
  // period so the iris is fully at rest before drawing attention to the control.
  const showDelay = IRIS_HERO.initAnimation
    ? IRIS_HERO.initAnimation.totalMs + 400
    : 800;

  return (
    <div className="flex flex-col items-center">
      <Iris ref={irisRef} config={IRIS_HERO} uid="hero" />

      {/* Aperture strip — mobile touch control, hidden on desktop */}
      <div className="md:hidden mt-1" style={{ width: IRIS_HERO.size }}>
        <ApertureStrip
          irisRef={irisRef}
          defaultFStop={IRIS_HERO.defaultFStop}
          showDelay={showDelay}
          hideAfterMs={3500}
        />
      </div>
    </div>
  );
}
