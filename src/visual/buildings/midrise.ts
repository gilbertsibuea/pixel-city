import { defineSprite } from "./types";
import { makeTowerRows } from "./tower";

/** Tahap 4: gedung bertingkat dengan bendera di atap. */
export const midrise = defineSprite({
  id: "midrise",
  name: "Gedung bertingkat",
  rows: makeTowerRows(14, 26, "c", "C"),
  flag: true,
});
