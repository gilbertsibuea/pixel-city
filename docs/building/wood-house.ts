import { defineSprite } from "../types";

/** Tahap 2: rumah kayu dengan cerobong berasap. */
export const woodHouse = defineSprite({
  id: "wood-house",
  name: "Rumah kayu",
  rows: [
    ".....oooo.OO..",
    "...oooooooOO..",
    ".oooooooooooo.",
    "OOOOOOOOOOOOOO",
    ".kkkkkkkkkkkk.",
    ".kwwkkkkkkwwk.",
    ".kwwkkddkkwwk.",
    ".kkkkkddkkkkk.",
    ".KKKKKKKKKKKK.",
  ],
  smokeX: 10,
});
