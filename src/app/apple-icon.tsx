import { ImageResponse } from "next/og";
import { bladePath, coverPoints, R } from "@/lib/aperture";
import { BRAND_LOGO } from "@/config/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const T = BRAND_LOGO.t;
const BLADE_COUNT = BRAND_LOGO.N;
const STEP_DEG = 360 / BLADE_COUNT;
const bp = bladePath(T, BRAND_LOGO);
const cp = coverPoints(T, BRAND_LOGO);

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
        <svg viewBox="-112 -112 224 224" width={160} height={160}>
          <clipPath id="ai-clip">
            <circle r={R} />
          </clipPath>
          <g clipPath="url(#ai-clip)">
            {Array.from({ length: BLADE_COUNT }, (_, i) => (
              <g key={i} transform={`rotate(${STEP_DEG * i})`}>
                <path d={bp} fill="#18181b" />
              </g>
            ))}
          </g>
          <polygon points={cp} fill="#ffffff" />
        </svg>
      </div>
    ),
    { width: 180, height: 180 }
  );
}
