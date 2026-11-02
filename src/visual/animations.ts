/** CSS animations for the city SVG. Stepped timing keeps a pixel-art feel. */
export const CITY_ANIMATIONS_CSS = `
@keyframes sun-drift {
  0%, 100% { transform: translate(0px, 0px); }
  50% { transform: translate(18px, 4px); }
}
@keyframes cloud-drift {
  0% { transform: translateX(0); }
  100% { transform: translateX(40px); }
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
@keyframes car-drive {
  0% { transform: translateX(-30px); }
  100% { transform: translateX(760px); }
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

.sun { animation: sun-drift 24s steps(6) infinite; transform-box: fill-box; transform-origin: center; }
.cloud { animation: cloud-drift 36s steps(12) infinite alternate; }
.win.on { animation: win-flicker 3.2s steps(2) infinite; }
.blink { animation: blink 1.6s steps(2) infinite; }
.car { animation: car-drive 18s steps(36) infinite linear; }
.tree-top { animation: tree-sway 4s steps(4) infinite; transform-box: fill-box; transform-origin: bottom center; }
.smoke { animation: smoke-rise 2.4s steps(4) infinite; }
.flag { animation: flag-wave 1.2s steps(2) infinite; transform-box: fill-box; transform-origin: left center; }

@media (prefers-reduced-motion: reduce) {
  .sun, .cloud, .win.on, .blink, .car, .tree-top, .smoke, .flag { animation: none !important; }
}
`;
