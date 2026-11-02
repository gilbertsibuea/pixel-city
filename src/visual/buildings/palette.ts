/** Single shared palette. Keep it small so every building stays visually consistent. */
export const PALETTE: Readonly<Record<string, string>> = {
  r: "#c9a24d", // thatch
  R: "#8a6234", // thatch shadow
  k: "#a8794a", // wood
  K: "#7a5434", // wood shadow
  d: "#4a3020", // door
  o: "#c0504a", // roof / awning
  O: "#8f3a36", // roof shadow / chimney
  t: "#cfc8b4", // stone
  T: "#9a937f", // stone shadow
  c: "#8e9bb0", // concrete
  C: "#5d6b82", // concrete shadow
  m: "#3f5273", // tower glass
  M: "#26334a", // tower frame
  g: "#4f8a3a", // foliage
  b: "#6b4a2b", // trunk
  w: "#8fb4d6", // window (day, unlit) - normally replaced by <rect class="win">
  y: "#ffd84a", // sun
  q: "#ffffff", // cloud
  e: "#d94f4f", // car body
  n: "#222222", // car wheels
  f: "#f4f0cf", // moon
  // Construction / builders
  P: "#d0b06a", // scaffold boards
  Q: "#6b6f78", // steel beam / rebar
  X: "#f08a24", // crane orange
  H: "#ffd23f", // hard hat
  V: "#ff6a1a", // hi-vis vest
  F: "#e0b48a", // builder skin
};

/** Window colors when a repo has no known primary language. */
export const LANGUAGE_FALLBACK_COLOR = "#c9d1d9";
