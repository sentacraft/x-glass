import { ImageResponse } from "next/og";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";

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

export default function OpenGraphImage() {
  const logoPng = readFileSync(join(process.cwd(), "public/logo.png"));
  const logoSrc = `data:image/png;base64,${logoPng.toString("base64")}`;

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
          backgroundColor: "#FFFFFF",
          alignItems: "center",
          padding: "80px",
        }}
      >
        {/* Logo mark — the actual design PNG, pixel-perfect */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={420}
          height={420}
          alt=""
          style={{ flexShrink: 0 }}
        />

        {/* Vertical divider */}
        <div
          style={{
            width: "1px",
            height: "200px",
            backgroundColor: "#E5E5E5",
            marginLeft: "40px",
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
