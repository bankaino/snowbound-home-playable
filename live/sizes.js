// display sizes in VIEW px: { name: [w, h] } — 0 = keep the texture aspect. Regenerating an asset at another
// resolution never changes its game size (ref2game engine.md §7 "Display size vs texture size").
window.SIZES = {
  tile: [150, 150],         // a board tile inside its 170 px cell
  hero_sad: [0, 880], hero_happy: [0, 880], hero_dress: [0, 880], hero_snow: [0, 700],
  door: [0, 760],
  window_patch: [330, 0],   // over the broken window in bg_room (position: SIZES.patchAt, filled in once the art exists)
  patchAt: [0.27, 0.19],    // centre of the window as a fraction of the cover-fitted background
  bubble: [270, 270], icon: [170, 170],
  hand: [0, 190],
};
