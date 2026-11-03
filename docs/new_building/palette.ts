/**
 * Single shared palette (retouch pass).
 *
 * Changes vs. previous version:
 *  - Shadow tones are shifted slightly COOLER (toward blue/purple) and kept subtle.
 *  - 7 new keys only: one highlight per material family (j i u s h l) + one shared
 *    contact shadow (B). Existing keys keep their letters and roles.
 */
export const PALETTE: Readonly<Record<string, string>> = {
	// Thatch (hut roof)
	j: "#e6c765", // highlight (NEW)
	r: "#c9a24d",
	R: "#7b5636", // shadow (was #8a6234)

	// Wood
	i: "#c99a5e", // highlight (NEW)
	k: "#a8794a",
	K: "#6b4a3a", // shadow (was #7a5434)
	d: "#4a3020", // door

	// Brick roof / awning / chimney
	u: "#e07a5f", // highlight (NEW)
	o: "#c0504a",
	O: "#7e3640", // shadow (was #8f3a36)

	// Stone
	s: "#e6e0cf", // highlight (NEW)
	t: "#cfc8b4",
	T: "#8d8794", // shadow (was #9a937f)

	// Concrete (mid-rise)
	h: "#b4c2d4", // highlight (NEW)
	c: "#8e9bb0",
	C: "#56627c", // shadow / frame (was #5d6b82)

	// Tower glass (skyscraper, landmark)
	l: "#6c86a8", // highlight / sky reflection (NEW)
	m: "#3f5273",
	M: "#232c47", // frame (was #26334a)

	// Shared contact shadow (NEW): ground line, under eaves
	B: "#2e2a3d",

	// Windows (unlit day)
	w: "#8fb4d6",

	// Environment & vehicles (unchanged)
	g: "#4f8a3a",
	b: "#6b4a2b",
	y: "#ffd84a",
	q: "#ffffff",
	e: "#d94f4f",
	n: "#222222",
	f: "#f4f0cf",

	// Construction & builders (unchanged)
	P: "#d0b06a",
	Q: "#6b6f78",
	X: "#f08a24",
	H: "#ffd23f",
	V: "#ff6a1a",
	F: "#e0b48a",
};
