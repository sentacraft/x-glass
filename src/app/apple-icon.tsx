import { ImageResponse } from "next/og";
import {
  solveAllBlades,
  bladeShapePath,
  thetaRange,
  buildDerivedConfig,
  computeThetaOpen,
  tNormToTheta,
} from "@/lib/iris-kinematics";
import { BRAND_LOGO } from "@/config/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Pre-compute at module level (runs once per server render).
// Satori constraint: no SVG mask or filter elements — fill pass only.
const R_HOUSING = 100;
const dc = buildDerivedConfig(BRAND_LOGO, R_HOUSING);
const thetaOpen = computeThetaOpen(dc, R_HOUSING);
const theta = tNormToTheta(BRAND_LOGO.t, thetaOpen, thetaRange(dc).max);
const blades = solveAllBlades(theta, dc);
const shape = bladeShapePath(dc);
const N = dc.N;
const stepDeg = 360 / N;
const b0 = blades[0];
const b0AngleDeg = (b0.bladeAngle * 180) / Math.PI;
const b0Transform = `translate(${b0.pivotPos.x.toFixed(3)},${b0.pivotPos.y.toFixed(3)}) rotate(${b0AngleDeg.toFixed(3)})`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "180px",
          height: "180px",
          backgroundColor: "white",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Aperture mark — fill pass only (Satori: no mask/filter). */}
        <svg viewBox="-112 -112 224 224" width={160} height={160}>
          <clipPath id="ai-clip">
            <circle r={R_HOUSING} />
          </clipPath>
          <g clipPath="url(#ai-clip)">
            {Array.from({ length: N }, (_, i) => (
              <g key={i} transform={`rotate(${(stepDeg * i).toFixed(3)})`}>
                <g transform={b0Transform}>
                  <path d={shape} fill="#18181b" />
                </g>
              </g>
            ))}
          </g>
          {/* Housing cover plate — hides blade roots. */}
          <circle
            r={R_HOUSING - dc.bladeWidth / 2}
            fill="none"
            stroke="#ffffff"
            strokeWidth={dc.bladeWidth + 1}
          />
        </svg>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
