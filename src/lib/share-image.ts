import { domToPng } from "modern-screenshot";

/**
 * Rasterize a DOM node to a PNG data URL at 2× scale.
 * The node must already be in the document (painted and visible).
 */
export async function rasterizePoster(node: HTMLElement): Promise<string> {
  return domToPng(node, { scale: 2, backgroundColor: "#ffffff" });
}
