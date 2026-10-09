// display sizes in VIEW px: { name: [w, h] } — 0 = keep the texture aspect. Regenerating an asset at another
// resolution never changes its game size (ref2game engine.md §7 "Display size vs texture size").
// Anchors of things painted INTO a background are image fractions [x, y] of that background (cover-fit by the scene), measured from the art.
window.SIZES = {
  tile: [150, 150],         // a board tile fits inside this box (aspect kept) within its 170 px cell
  hero_sad: [0, 880], hero_happy: [0, 880], hero_dress: [0, 880], hero_snow: [900, 0],
  icon: [170, 170], hand: [0, 190],
  doorBox: [0.585, 0.185, 0.825, 0.505],       // the lit arch opening in bg_outside: [left, top, right, bottom] — the door leaf covers it
  winAt: [0.35, 0.20],                         // centre of the broken window in bg_room
  patchRect: [0.0684, 0.0163, 0.6152, 0.3809], // where window_patch is pasted over bg_room (it is the edited crop of exactly this area)
};
