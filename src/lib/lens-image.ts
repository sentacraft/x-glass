/**
 * Controls how much of the original square image edge remains visible after crop.
 * Example: 0.75 keeps 75% of the original edge length, which crops away 12.5%
 * from each side of the source image.
 */
export const LENS_IMAGE_VISIBLE_EDGE_RATIO = 0.75;

export const LENS_IMAGE_SCALE = 1 / LENS_IMAGE_VISIBLE_EDGE_RATIO;

export const lensImageStyle = {
  transform: `scale(${LENS_IMAGE_SCALE})`,
};
