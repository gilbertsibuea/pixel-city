import { defineSprite } from "./types";
import { makeTowerRows } from "./tower";

/** Tahap 5: pencakar langit dengan antena berkedip. */
export const skyscraper = defineSprite({
  id: "skyscraper",
  name: "Pencakar langit",
  rows: makeTowerRows(12, 40, "m", "M", true),
});
