import { ImageResponse } from "next/og";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { bladePath, coverPoints, R, BLADE_COUNT, STEP_DEG } from "@/lib/aperture";
import { BRAND_LOGO } from "@/config/brand";

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

const T = BRAND_LOGO.t;
const bp = bladePath(T);
const cp = coverPoints(T);

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
        {/* Aperture mark — inline SVG (Satori does not support mask/filter) */}
        <svg
          viewBox="-112 -112 224 224"
          width={380}
          height={380}
          style={{ flexShrink: 0 }}
        >
          {/* Clipping circle */}
          <clipPath id="og-clip">
            <circle r={R} />
          </clipPath>
          <g clipPath="url(#og-clip)">
            {Array.from({ length: BLADE_COUNT }, (_, i) => (
              <g key={i} transform={`rotate(${STEP_DEG * i})`}>
                <path d={bp} fill="#18181b" />
              </g>
            ))}
          </g>
          {/* Cover polygon hides center */}
          <polygon points={cp} fill="#FAFAF9" />
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
