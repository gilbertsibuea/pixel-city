/** CSS animations for the city SVG. Stepped timing keeps a pixel-art feel. */
export function cityAnimationsCss(driveEndPx: number): string {
	return `
@keyframes sun-drift {
  0%, 100% { transform: translate(0px, 0px); }
  50% { transform: translate(22px, 6px); }
}
/* Westward drift (to the left), like the real sky. */
@keyframes moon-drift {
  0% { transform: translate(0px, 0px); }
  50% { transform: translate(-36px, 4px); }
  100% { transform: translate(-72px, 10px); }
}
@keyframes cloud-drift {
  0% { transform: translateX(0); }
  100% { transform: translateX(40px); }
}
@keyframes cloud-drift-slow {
  0% { transform: translateX(0); }
  100% { transform: translateX(-32px); }
}
@keyframes bird-fly {
  0% { transform: translate(0px, 0px); }
  50% { transform: translate(90px, -8px); }
  100% { transform: translate(180px, 4px); }
}
@keyframes star-twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.15; }
}
/* Float from spawn toward upper-left so balloons stay readable in the sky. */
@keyframes balloon-float {
  0% { transform: translate(0px, 0px); opacity: 1; }
  70% { opacity: 1; }
  100% { transform: translate(-72px, -36px); opacity: 0.35; }
}
@keyframes win-flicker {
  0%, 100% { opacity: 1; }
  40% { opacity: 1; }
  50% { opacity: 0.45; }
  60% { opacity: 1; }
}
@keyframes blink {
  0%, 70%, 100% { opacity: 1; }
  80% { opacity: 0.15; }
}
@keyframes vehicle-drive {
  0% { transform: translateX(-70px); }
  100% { transform: translateX(${Math.max(driveEndPx, 200)}px); }
}
@keyframes vehicle-drive-rev {
  0% { transform: translateX(${Math.max(driveEndPx, 200)}px); }
  100% { transform: translateX(-80px); }
}
@keyframes tree-sway {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(3deg); }
}
@keyframes smoke-rise {
  0% { transform: translateY(0); opacity: 0.85; }
  100% { transform: translateY(-14px); opacity: 0; }
}
@keyframes flag-wave {
  0%, 100% { transform: scaleX(1); }
  50% { transform: scaleX(0.7); }
}
@keyframes walk {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(6px); }
}
@keyframes walk-long {
  0% { transform: translateX(0); }
  100% { transform: translateX(28px); }
}

.sun { animation: sun-drift 24s steps(6) infinite; }
.moon { animation: moon-drift 48s steps(12) infinite alternate; }
.cloud { animation: cloud-drift 36s steps(12) infinite alternate; }
.cloud-alt { animation: cloud-drift-slow 42s steps(14) infinite alternate; }
.bird { animation: bird-fly 16s steps(16) infinite; }
.star { animation: star-twinkle 2.4s steps(2) infinite; }
.balloon { animation: balloon-float 10s steps(10) infinite; }
.win.on { animation: win-flicker 3.2s steps(2) infinite; }
.blink { animation: blink 1.6s steps(2) infinite; }
.vehicle { animation: vehicle-drive 16s steps(32) infinite; }
.vehicle.rev { animation: vehicle-drive-rev 20s steps(40) infinite; }
.tree-top { animation: tree-sway 4s steps(4) infinite; transform-box: fill-box; transform-origin: bottom center; }
.smoke { animation: smoke-rise 2.4s steps(4) infinite; }
.flag { animation: flag-wave 1.2s steps(2) infinite; transform-box: fill-box; transform-origin: left center; }
.pedestrian { animation: walk-long 6s steps(6) infinite alternate; }

@media (prefers-reduced-motion: reduce) {
  .sun, .moon, .cloud, .cloud-alt, .bird, .star, .balloon, .win.on, .blink,
  .vehicle, .tree-top, .smoke, .flag, .pedestrian { animation: none !important; }
}
`;
}

/** @deprecated use cityAnimationsCss(width) — kept for gallery imports that need static CSS */
export const CITY_ANIMATIONS_CSS = cityAnimationsCss(760);
