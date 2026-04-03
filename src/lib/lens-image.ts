/**
 * Lens renders use square source assets, so we keep them unscaled and let the
 * container spacing control the perceived size. This avoids clipping long or
 * wide lenses near the image bounds.
 */
export const lensImageStyle = {
  objectPosition: "center",
} as const;
