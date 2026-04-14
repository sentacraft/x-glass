import { ImageResponse } from "next/og";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import {
  solveAllBlades,
  bladeShapePath,
  thetaRange,
  buildDerivedConfig,
  computeThetaOpen,
  findThetaForFStop,
} from "@/lib/iris-kinematics";
import { IRIS_NAV, R_HOUSING } from "@/config/iris-config";

/** Walk up directory tree until node_modules/<pkg>/<relPath> is found. */
function resolvePackageFile(pkg: string, relPath: string): string {
  let dir = process.cwd();
  while (true) {
    const candidate = join(dir, "node_modules", pkg, relPath);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) throw new Error(`Cannot find ${pkg}/${relPath} in any node_modules`);
    dir = parent;
  }
}

export const alt = "X-Glass — Camera Lens Database";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Pre-compute at module level (runs once per server render).
// Satori constraint: no SVG mask or filter elements — fill pass only.
const dc = buildDerivedConfig(IRIS_NAV, R_HOUSING);
const thetaOpen = computeThetaOpen(dc, R_HOUSING);
const theta = findThetaForFStop(IRIS_NAV.defaultFStop, dc, { min: thetaOpen, max: thetaRange(dc).max }, IRIS_NAV.openFStop);
const blades = solveAllBlades(theta, dc);
const shape = bladeShapePath(dc);
const N = dc.N;
const stepDeg = 360 / N;
const b0 = blades[0];
const b0AngleDeg = (b0.bladeAngle * 180) / Math.PI;
const b0Transform = `translate(${b0.pivotPos.x.toFixed(3)},${b0.pivotPos.y.toFixed(3)}) rotate(${b0AngleDeg.toFixed(3)})`;

export default function OpenGraphImage() {
  const geistBold = readFileSync(
    resolvePackageFile("geist", "dist/fonts/geist-sans/Geist-Bold.ttf")
  );
  const geistRegular = readFileSync(
    resolvePackageFile("geist", "dist/fonts/geist-sans/Geist-Regular.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          width: "1200px",
          height: "630px",
          backgroundColor: "#FAFAF9",
          alignItems: "center",
          padding: "80px",
        }}
      >
        {/* Aperture mark — fill pass only (Satori: no mask/filter). */}
        <svg
          viewBox="-112 -112 224 224"
          width={380}
          height={380}
          style={{ flexShrink: 0 }}
        >
          <clipPath id="og-clip">
            <circle r={R_HOUSING} />
          </clipPath>
          <g clipPath="url(#og-clip)">
            {Array.from({ length: N }, (_, i) => (
              <g key={i} transform={`rotate(${(stepDeg * i).toFixed(3)})`}>
                <g transform={b0Transform}>
                  <path d={shape} fill={IRIS_NAV.bladeColor} />
                </g>
              </g>
            ))}
          </g>
          {/* Housing cover plate — hides blade roots. */}
          <circle
            r={R_HOUSING - dc.bladeWidth / 2}
            fill="none"
            stroke="#FAFAF9"
            strokeWidth={dc.bladeWidth + 1}
          />
        </svg>

        {/* Vertical divider */}
        <div
          style={{
            width: "1px",
            height: "200px",
            backgroundColor: "#E5E5E5",
            marginLeft: "48px",
            flexShrink: 0,
          }}
        />

        {/* Brand text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            marginLeft: "52px",
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "#1A1A1A",
              fontFamily: "Geist",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            X-Glass
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 400,
              color: "#8A8A8A",
              fontFamily: "Geist",
              letterSpacing: "0.12em",
              marginTop: 24,
              textTransform: "uppercase",
            }}
          >
            Lens data, normalized.
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Geist", data: geistBold, style: "normal", weight: 700 },
        { name: "Geist", data: geistRegular, style: "normal", weight: 400 },
      ],
    }
  );
}
