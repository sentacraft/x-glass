export interface Lens {
  id: string; // e.g. "xf35mm-f14-r"
  brand: string; // e.g. "Fujifilm" | "Viltrox" | "Sigma"
  series: string; // e.g. "XF" | "XC" | "" (empty for third-party)
  model: string; // official model name, e.g. "XF35mmF1.4 R"
  generation?: number; // 1 | 2 — differentiates old vs new versions of same focal length
  focalLengthMin: number; // wide end in mm (equals focalLengthMax for primes)
  focalLengthMax: number; // tele end in mm (equals focalLengthMin for primes)
  maxAperture: number; // e.g. 1.4 (wide-end value for variable-aperture zooms)
  minAperture: number; // smallest aperture (largest f-number)
  af: boolean;
  ois: boolean;
  wr: boolean;
  weightG: number; // weight in grams
  diameterMm: number; // max diameter in mm
  lengthMm: number; // length in mm
  filterMm: number; // filter thread diameter in mm
  minFocusDistanceCm: number; // minimum focus distance in cm
  // priceApproxCNY: number | null; -- deferred, not planned for any near-term phase
  releaseYear: number;
  officialUrl?: string;
  imageUrl?: string; // main product image (front view)
  mtfImageUrl?: string; // phase 2 — leave empty for MVP
}
