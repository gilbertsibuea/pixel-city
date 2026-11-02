/**
 * Sprite grid legend (one character = one pixel):
 *   '.'  transparent
 *   'w'  window  -> rendered as individual <rect class="win|win on"> (lit by commit activity)
 *   'A'  beacon  -> rendered as <rect class="blink"> (antenna light)
 *   any other key of PALETTE -> solid color
 */
export type BuildingId = "hut" | "wood-house" | "stone-shop" | "midrise" | "skyscraper";

export interface BuildingSprite {
  id: BuildingId;
  /** Display name (Bahasa Indonesia), used in legends and aria labels. */
  name: string;
  rows: string[];
  width: number;
  height: number;
  /** Chimney smoke: x offset (in pixels) from the sprite's left edge. */
  smokeX?: number;
  /** Rooftop flag that waves. */
  flag?: boolean;
}

/** Builds a sprite and verifies that every row has the same width. */
export function defineSprite(
  s: Omit<BuildingSprite, "width" | "height">
): BuildingSprite {
  const width = s.rows[0].length;
  s.rows.forEach((r, i) => {
    if (r.length !== width) {
      throw new Error(`Sprite "${s.id}" row ${i} has width ${r.length}, expected ${width}`);
    }
  });
  return { ...s, width, height: s.rows.length };
}
