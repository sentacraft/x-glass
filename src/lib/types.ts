export interface Lens {
  id: string;                        // "xf35mm-f14-r"
  brand: string;                     // "Fujifilm" | "Viltrox" | "Sigma" ...
  series: string;                    // "XF" | "XC" | ""
  model: string;                     // "XF35mmF1.4 R"
  generation?: number;               // 1 | 2，区分同焦段新老代
  focalLength: number;               // 实际焦距（mm）
  focalLengthEquiv: number;          // 等效全画幅（×1.5 自动计算）
  maxAperture: number;               // 1.4
  minAperture: number;
  af: boolean;
  ois: boolean;
  wr: boolean;
  weightG: number;
  diameterMm: number;
  lengthMm: number;
  filterMm: number;
  minFocusDistanceCm: number;
  priceApproxCNY: number | null;
  releaseYear: number;
  officialUrl?: string;
  mtfImageUrl?: string;              // 二期填充，MVP 阶段留空
}
