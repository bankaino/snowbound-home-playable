// live/scene.js — SNOWBOUND HOME. Pure function of t and the sim state (no Math.random, no accumulated state).
// Layers: shot A (outside) | shot B (shelter + hero stack) → snow → grade + flash → bubbles → board (+ juice) → reveal FX → captions →
// finish → persistent CTA bar → endcard. Sprites are placeholders until phase 3; positions marked [ART] are tuned once the art exists.
(function () {
  const S = (window.SCENE = {}), A = window.ASSETS, L = LIB, M = L.M, W = SIM.VIEW.W, H = SIM.VIEW.H, Z = window.SIZES, K = SIM.K, UI = SIM.UI, SS = L.SS;
  S.programs = () => { L.init(W, H); BATCH.init(['tile_leaf', 'tile_coin', 'tile_yarn', 'tile_comb', 'tile_window', 'tile_dress']); };   // all 30 board tiles = one instanced draw
  const has = (n) => !!A[n];
  const FONT = '"Arial Black", "Arial Rounded MT Bold", "Segoe UI Black", sans-serif';
  const ease = (x) => 1 - (1 - x) * (1 - x), clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const popk = (q) => (q <= 0 ? 0 : q < 1 ? 1.12 * ease(q) - 0.12 * q * q : 1);
  const TILE = ['tile_leaf', 'tile_coin', 'tile_yarn'], GOALTEX = { comb: 'tile_comb', window: 'tile_window', dress: 'tile_dress' };
  const TCOL = [[0.35, 0.85, 0.35], [1, 0.8, 0.2], [0.95, 0.3, 0.35]], GCOL = { comb: [0.5, 0.65, 1], window: [0.55, 0.85, 1], dress: [0.7, 0.95, 0.3] };
  const GOALP = [UI.goal.x + 84, UI.goal.y + UI.goal.h / 2];                   // where goal tiles land (the panel's icon)
  const HERO = [W * 0.5, H * 0.80];                                            // shelter hero: centre x, bottom y [ART]
  let OX = 0, OY = 0, ZF = 1;                                                          // trauma shake of the world this frame
  S.hit = [];

  // sprite helpers (view px)
  const zr = (x, y, w, h) => [W / 2 + (x - W / 2) * ZF, H * 0.55 + (y - H * 0.55) * ZF, w * ZF, h * ZF];      // reveal push-in around the room's centre
  const cov = (n) => { const tx = G.tex(n), k = Math.max(W / tx.w, H / tx.h) * 1.05; return { k, x0: (W - tx.w * k) / 2, y0: (H - tx.h * k) / 2, tx }; };   // cover-fit of a background
  const imgPt = (n, fx, fy) => { const c = cov(n); return [c.x0 + fx * c.tx.w * c.k, c.y0 + fy * c.tx.h * c.k]; };                                      // image fraction → view px
  const cover = (n) => { if (!has(n)) return; const tx = G.tex(n), k = Math.max(W / tx.w, H / tx.h) * 1.05, w = tx.w * k, h = tx.h * k; { const [x1, y1, w1, h1] = zr((W - w) / 2 + OX, (H - h) / 2 + OY, w, h); L.sprite(n, x1, y1, { w: w1, h: h1 }); } };
  const spr = (n, cx, cy, w, h, o = {}) => { if (!has(n)) return; const s = o.s === undefined ? 1 : o.s, sx = (o.sx || 1) * s, sy = (o.sy || 1) * s; if (s <= 0.01) return;
    const tw = G.tex(n).w, th = G.tex(n).h; if (w && h) { const f = Math.min(w / tw, h / th); w = tw * f; h = th * f; }      // both given = fit inside the box, aspect kept
    if (!w) w = L.hsz(n, h); if (!h) h = w * th / tw; L.sprite(n, cx - w * sx / 2, cy - h * sy / 2, { w: w * sx, h: h * sy, u: { alpha: o.a === undefined ? 1 : o.a } }); };
  // all room heroes share one scale (same canvas), so the cross-fade does not jump
  const hero = (n, cx, bottom, a = 1) => { if (!has(n) || a <= 0.003) return; const ks = Z[n][1] ? Z.hero_sad[1] / G.tex('hero_sad').h : 0, h = ks ? G.tex(n).h * ks : L.sz(n, Z[n][0] / G.tex(n).w)[1], w = ks ? G.tex(n).w * ks : Z[n][0]; const [x1, y1, w1, h1] = zr(cx - w / 2 + OX, bottom - h + OY, w, h); L.sprite(n, x1, y1, { w: w1, h: h1, u: { alpha: a } }); };
  const panel = (slot, x, y, w, h, c0, c1, a = 0.85) => { L.rrect(x, y, w, h, Math.min(h / 2, 40), c0, c1, a); L.uiBox(slot, x, y, w, h, 4); };
  const bubble = (x, y, r, a, hot = 1, tail = null) => { L.glow(x, y, r * 1.55, [1, 0.95, 0.5], 0.35 * a * hot, 2.2);
    L.shadow(x + 5, y + 12, r * 1.08, r * 1.0, 0.32 * a);
    if (tail) { const an = Math.atan2(tail[1] - y, tail[0] - x), ts = r * 0.66, tx = x + Math.cos(an) * r * 1.0, ty = y + Math.sin(an) * r * 1.0;      // tail points at Mia
      L.solid(tx - ts * 0.6, ty - ts * 0.6, ts * 1.2, ts * 1.2, [1, 0.8, 0.25], an + Math.PI / 4, ts * 0.6, ts * 0.6, a); L.solid(tx - ts / 2, ty - ts / 2, ts, ts, [1, 1, 1], an + Math.PI / 4, ts / 2, ts / 2, a); }
    L.rrect(x - r - 5, y - r - 5, 2 * r + 10, 2 * r + 10, r + 5, [1, 0.86, 0.32], [0.9, 0.6, 0.12], a);                     // golden rim
    L.rrect(x - r, y - r, 2 * r, 2 * r, r, [1, 1, 1], [0.86, 0.9, 1], a); };
  const lock = (x, y, a, k = 1) => { L.rrect(x - 15 * k, y - 34 * k, 30 * k, 44 * k, 14 * k, [0.82, 0.84, 0.92], [0.66, 0.68, 0.8], a); L.rrect(x - 26 * k, y - 6 * k, 52 * k, 42 * k, 10 * k, [0.98, 0.8, 0.25], [0.85, 0.6, 0.12], a); L.solid(x - 4 * k, y + 8 * k, 8 * k, 14 * k, [0.3, 0.2, 0.05], 0, 0, 0, a); };
  const handAt = (hx, hy, down) => { if (down) L.glow(hx, hy, 70, [1, 1, 1], 0.35, 2.5);
    if (has('hand')) { const hh = Z.hand[1] * (down ? 0.92 : 1), hw = L.hsz('hand', hh); L.sprite('hand', hx - hw * 0.218, hy - hh * 0.004, { w: hw, h: hh }); }
    else { L.rrect(hx - 34, hy - 34, 68, 68, 34, [1, 1, 1], [0.86, 0.86, 0.9], 0.9); L.ring(hx, hy, 52, 52, [1, 1, 1], down ? 0.8 : 0.3, 0.12); } };
  const caption = (slot, txt, y, a = 1) => { const tw = L.labelW(slot, txt, { size: 58, font: FONT });
    panel(slot, W / 2 - tw / 2 - 44, y - 56, tw + 88, 112, [0.06, 0.08, 0.16], [0.03, 0.04, 0.10], 0.78 * a);
    L.label(slot, txt, W / 2, y, { size: 58, font: FONT, col: '#ffffff', out: '#0a1a3a', al: 0.5, a }); };
  const sparks = (x, y, q, n, spread, col, size, seed) => { for (let j = 0; j < n; j++) { const an = L.rnd(seed, j) * 6.283, d = spread * (0.45 + 0.55 * L.rnd(seed + 1, j)) * ease(q);
    L.star(x + Math.cos(an) * d, y + Math.sin(an) * d - 30 * q, size * (1 - 0.7 * q), col, 1 - q); } };

  S.render = (t) => {
    const ST = S.state || SIM.at(t), GT = ST.t, rnd = L.rnd, bd = ST.bd, ph = ST.phase, ended = ST.end >= 0;
    const shelter = ST.cut >= 0 && GT >= ST.cut, reveal = ph === 'reveal', rt = reveal ? GT - ST.phaseT : 0, warm = reveal ? SS(0, 1.5, rt) : 0, choice = ST.choice || 'comb';
    const win = choice === 'window', wg = warm * (win ? 0.5 : 0.08), snowOn = reveal && win ? 1 - SS(0, 1, rt) : 1;   // a repaired window stops the draft + snow; the other wishes leave the room cold
    const bq = bd && ph === 'board' ? ease(clamp((GT - ST.phaseT) / K.BOARD_IN, 0, 1)) : bd && reveal ? 1 - ease(clamp((rt - 0.05) / 0.35, 0, 1)) : 0, heroA = ended ? 0 : 1 - bq;   // board covers the room → the hero steps back
    ZF = reveal ? 1 + (choice === 'comb' ? 0.12 : 0.07) * SS(0, 1.4, rt) : 1;   // the comb's change is small: push in harder
    // ---- trauma shake from recent events ----
    let tr = 0; for (const e of ST.ev) { const a = GT - e.t; if (a < 0) continue;
      if (e.k === 'slam' && a < 0.5) tr = Math.max(tr, 1.1 * (1 - a / 0.5)); if (e.k === 'blast' && a < 0.4) tr = Math.max(tr, 0.8 * (1 - a / 0.4)); if (e.k === 'win' && a < 0.3) tr = Math.max(tr, 0.5 * (1 - a / 0.3)); }
    OX = 14 * tr * tr * Math.sin(GT * 83); OY = 14 * tr * tr * Math.sin(GT * 101 + 1);

    // ===== world =====
    L.beginBG([0.1, 0.12, 0.2, 1]);
    if (!shelter) {                                                              // shot A: the door slams, she is left in the snow
      cover('bg_outside');
      const open = 1 - ease(clamp((GT - 0.45) / 0.25, 0, 1)), sx = 0.15 + 0.85 * (1 - open), [dl, dt] = imgPt('bg_outside', Z.doorBox[0], Z.doorBox[1]), [dr, db] = imgPt('bg_outside', Z.doorBox[2], Z.doorBox[3]), dw = (dr - dl) * 1.0, dh = db - dt;
      L.glow((dl + dr) / 2 + OX, (dt + db) / 2 + OY, 700 * (0.35 + 0.65 * open), [1, 0.8, 0.4], 0.5 * open, 2.2);              // warm light that dies with the door
      L.glow((dl + dr) / 2 + OX, db + 60 + OY, 480 * open, [1, 0.75, 0.35], 0.4 * open, 2.4);
      if (has('door')) L.sprite('door', 0, 0, { m: M.of(M.t(dl + OX, db + OY), M.s(sx, 1)), w: dw, h: dh, pivot: [0, dh] });
      const u = ease(clamp(GT / 0.9, 0, 1)), hb = db + (H * 0.80 - db) * u - 70 * Math.sin(Math.PI * u);                // she is thrown out and slides onto the snow
      const hxs = (dl + dr) / 2 + (W * 0.40 - (dl + dr) / 2) * u; L.shadow(hxs + OX, hb - 4 + OY, 400, 44, 0.42 * SS(0, 0.15, GT)); hero('hero_snow', hxs, hb, SS(0, 0.15, GT));
      for (let i = 0; i < 16; i++) { const x = ((rnd(i, 9) * 1.5 * W - GT * 1100 * (0.6 + rnd(i, 8))) % (1.5 * W) + 1.5 * W) % (1.5 * W) - 0.2 * W;
        L.solid(x, rnd(i, 7) * H, 140 * (0.5 + rnd(i, 6)), 3, [1, 1, 1], -0.12, 0, 0, 0.3); }       // blizzard streaks
    } else {                                                                     // shot B: the shelter
      cover('bg_room');
      const sad = reveal && choice !== 'window' ? 1 - SS(0.5, 1.1, rt) : 1, cx = HERO[0] + (reveal && win ? 0 : 3 * Math.sin(GT * 38)), bot = HERO[1];
      L.shadow(cx + OX, bot - 10 + OY, 340, 48, 0.55 * heroA);                   // contact shadow: the chair stands on the floor
      hero('hero_sad', cx, bot, sad * heroA);
      if (reveal && choice === 'comb') hero('hero_comb', cx, bot, SS(0.5, 1.1, rt) * heroA);
      if (reveal && choice === 'dress') hero('hero_dress', cx, bot, SS(0.5, 1.1, rt) * heroA);
      if (reveal && K.SMILE) hero(choice === 'comb' ? 'hero_comb_smile' : choice === 'dress' ? 'hero_dress_smile' : 'hero_sad_smile', cx, bot, SS(2.0, 2.6, rt) * heroA);   // after the fix she lets out a faint, relieved smile
      if (reveal && choice === 'window' && has('window_patch')) { const [px0, py0] = imgPt('bg_room', Z.patchRect[0], Z.patchRect[1]), [px1, py1] = imgPt('bg_room', Z.patchRect[2], Z.patchRect[3]);
        const [x1, y1, w1, h1] = zr(px0 + OX, py0 + OY, px1 - px0, py1 - py0); L.sprite('window_patch', x1, y1, { w: w1, h: h1, u: { alpha: SS(0.5, 1.1, rt) } }); }
      if (!(reveal && win)) for (let j = 0; j < 3; j++) { const q = (GT * 0.9 + j / 3) % 1; L.puff(cx - 20 + 25 * q, bot - 655 - 90 * q, 14 + 28 * q, [1, 1, 1], 0.4 * (1 - q), j + 60); }   // breath puffs [ART: at her mouth]
      if (snowOn > 0.01 && bq < 0.9) for (let j = 0; j < 14; j++) { const WIN = imgPt('bg_room', Z.winAt[0], Z.winAt[1]), y = WIN[1] + 60 + (GT * 95 * (0.5 + rnd(j, 5)) + rnd(j, 6) * 600) % 640; L.puff(WIN[0] + (rnd(j, 4) - 0.5) * 280 + 30 * Math.sin(GT + j), y, 7 + 5 * rnd(j, 3), [1, 1, 1], 0.5 * snowOn, j + 80); }   // snow through the window
    }
    for (let i = 0; i < (bq > 0.9 ? 10 : 36); i++) { const drift = shelter ? 40 : 160, x = (rnd(i, 1) * W + drift * Math.sin(GT * 0.8 + i) + (shelter ? 0 : GT * 160 * rnd(i, 2))) % W, y = (GT * 130 * (0.5 + rnd(i, 2)) + rnd(i, 3) * H) % H;
      L.puff(x, y, 6 + 6 * rnd(i, 4), [1, 1, 1], 0.5 * (1 - 0.9 * (1 - snowOn)), i); }
    L.solid(0, 0, W, H, [0.05, 0.1, 0.3], 0, 0, 0, 0.16 * (1 - wg));          // the room stays cold; only a repaired window warms it a little
    L.solid(0, 0, W, H, [1.0, 0.65, 0.25], 0, 0, 0, 0.16 * wg);
    if (ST.cut >= 0 && GT - ST.cut < 0.3) L.solid(0, 0, W, H, [1, 1, 1], 0, 0, 0, 0.95 * (1 - (GT - ST.cut) / 0.3));   // whip flash on the cut
    if (reveal) { const wp = imgPt('bg_room', Z.winAt[0], Z.winAt[1]); if (win) L.glow(wp[0], wp[1], 700, [1, 0.8, 0.45], 0.5 * warm, 2.2); else L.glow(HERO[0], choice === 'comb' ? HERO[1] - 640 : HERO[1] - 400, 520, [1, 0.8, 0.5], 0.35 * Math.sin(Math.PI * Math.min(1, rt / 2.4)), 2.2);   // light only where the change happened
      if (rt > 0.35 && rt < 0.65) L.solid(0, 0, W, H, [1, 0.97, 0.85], 0, 0, 0, 0.55 * (1 - Math.abs(rt - 0.5) / 0.15)); }       // bloom flash as the swirl closes, warm light pours in
    L.beginComp();

    // ===== choice: three bubbles (they pop in, the chosen one flies to the goal panel) =====
    S.hit = [];
    if (ph === 'choice' || (ph === 'board' && GT - ST.phaseT < 0.55)) {
      UI.ORDER.forEach((n, i) => { const b = UI.bubbles[n]; let k = popk((GT - ST.phaseT - 0.12 * i) / 0.3), x = b.x, y = b.y + 9 * Math.sin(GT * 3 + i * 2), hot = 0.8 + 0.2 * Math.sin(GT * 4 + i);
        if (ph === 'board') { const q = clamp((GT - ST.phaseT) / 0.5, 0, 1); k = 1;
          if (n === choice) { x += (GOALP[0] - x) * ease(q); y += (GOALP[1] - y) * ease(q); k = (1 + 0.25 * Math.sin(Math.PI * Math.min(1, q * 2))) * (1 - 0.7 * q); hot = 1.6; } else k = 1 - q; }
        if (k <= 0.01) return; bubble(x, y, b.r * k, 1, hot, ph === 'choice' ? [HERO[0], HERO[1] - 700] : null); spr(GOALTEX[n], x, y, Z.icon[0] * k, Z.icon[1] * k); });
      if (ph === 'board') { const q = (GT - ST.phaseT) / 0.55; if (q < 1) sparks(UI.bubbles[choice].x, UI.bubbles[choice].y, q, 12, 190, [1, 0.95, 0.6], 30, 3); }
      if (ph === 'choice') { const b = UI.bubbles[K.PICK], q = (GT * 1.3) % 1, down = q > 0.15 && q < 0.7;
        if (GT - ST.phaseT > 0.5) handAt(b.x + 30, b.y + 50 + (down ? 8 : 0), down); }
    }

    // ===== board =====
    if (bd && bq > 0.001 && !ended) { const oy = (1 - bq) * (H - UI.board.y + 40) + OY, ox = OX;
      L.solid(0, 0, W, H, [0.02, 0.04, 0.1], 0, 0, 0, 0.45 * bq);
      L.shadow(UI.board.x + UI.board.w / 2 + ox, UI.board.y + UI.board.h / 2 + 18 + oy, UI.board.w * 0.56, UI.board.h * 0.54, 0.4 * bq);
      L.rrect(UI.board.x - 9 + ox, UI.board.y - 9 + oy, UI.board.w + 18, UI.board.h + 18, 42, [0.62, 0.84, 1], [0.32, 0.58, 0.92], 0.98);       // light-blue rim
      L.rrect(UI.board.x + ox, UI.board.y + oy, UI.board.w, UI.board.h, 34, [0.16, 0.28, 0.55], [0.08, 0.16, 0.38], 0.97);
      L.rrect(UI.grid.x - 6 + ox, UI.grid.y + oy - 6, UI.grid.w + 12, UI.grid.h + 12, 26, [0.12, 0.22, 0.46], [0.10, 0.2, 0.42], 1);
      for (let i = 0; i < K.COLS * K.ROWS; i++) { const [cx, cy] = SIM.cellXY(i); if ((i + Math.floor(i / K.COLS)) % 2) L.rrect(cx - 80 + ox, cy - 80 + oy, 160, 160, 22, [0.2, 0.34, 0.62], [0.2, 0.34, 0.62], 0.35); }
      bd.cells.forEach((c, i) => { const [cx, cy] = SIM.cellXY(i), q = c.clr >= 0 ? clamp((GT - c.clr) / K.CLEAR_T, 0, 1) : 0; if (q >= 1) return;
        const sel = ST.sel === i ? 1.12 + 0.04 * Math.sin(GT * 12) : 1, bad = ST.ev.some((e) => e.k === 'bad' && (e.a === i || e.b === i) && GT - e.t < 0.3 && GT - e.t > K.SWAP_T) ? 8 * Math.sin(GT * 90) : 0;
        const bob = c.k === 3 && ph === 'board' ? 1 + 0.035 * Math.sin(GT * 4 + i) : 1, up = c.vy < 0, sq = c.bn || up ? 0.07 : 0;      // goal tiles breathe; landing squash
        const into = SS(UI.grid.y - 90, UI.grid.y + 30, cy + c.fy);                // new tiles fade in as they enter the frame (no scissor in the engine)
        const nm = c.k === 3 ? GOALTEX[choice] : TILE[c.k], asp = BATCH.aspect(nm), bw0 = asp >= 1 ? Z.tile[0] : Z.tile[1] * asp, bh0 = bw0 / asp;     // fit inside the 150 box, aspect kept
        const sc = sel * bob * (1 + 0.3 * Math.sin(Math.PI * q * 0.5)) * (q > 0.8 ? (1 - q) / 0.2 : 1) * into, w1 = bw0 * sc * (1 + sq), h1 = bh0 * sc * (1 - sq);   // instanced = no per-tile alpha: tiles pop out / grow in by scale
        BATCH.add(nm, cx + c.ox + bad + ox - w1 / 2, cy + c.oy + c.fy + oy - h1 / 2, w1, h1); });
      BATCH.flush(t);
      if (ST.sel >= 0) { const [cx, cy] = SIM.cellXY(ST.sel); L.ring(cx + ox, cy + oy, 92, 92, [1, 1, 1], 0.7, 0.08); }
      // juice per match: tile-coloured sparkles per cleared tile, line-blast beam
      for (const e of ST.ev) { const a = GT - e.t; if (a < 0 || a > 0.5) continue; const q = a / 0.5;
        if (e.k === 'match') e.idx.forEach((ci, j) => { const [cx, cy] = SIM.cellXY(ci); sparks(cx + ox, cy + oy, q, Math.max(2, Math.min(8, Math.round(44 / e.idx.length))), 130, e.kk[j] === 3 ? [...GCOL[choice]] : TCOL[e.kk[j]], 20, ci * 7 + e.n); });
        if (e.k === 'blast' && a < 0.4) { const r = 1 - a / 0.4, horiz = e.row !== undefined;                       // layered glow beam: wide soft, mid, white core
          for (const [th, al] of [[150, 0.25], [78, 0.5], [26, 1]]) { const hh = th * r;
            if (horiz) L.solid(UI.grid.x + ox - 20, e.y - hh / 2 + oy, UI.grid.w + 40, hh, [1, 0.95, 0.7], 0, 0, 0, al * r); else L.solid(e.x - hh / 2 + ox, UI.grid.y + oy - 20, hh, UI.grid.h + 40, [1, 0.95, 0.7], 0, 0, 0, al * r); }
          L.glow((horiz ? W / 2 : e.x) + ox, (horiz ? e.y : BY0()) + oy, 700, [1, 0.95, 0.6], 0.55 * r, 2.2); } }
      // goal panel: icon + counter; the counter counts tiles that have landed, with a pop on each landing
      let inflight = 0, bump = 0; for (const e of ST.ev) { const a = GT - e.t - 0.025 * (e.n % 4); if (e.k !== 'goal' || a < 0) continue;
        if (a < 0.6) { inflight++; const u = ease(a / 0.6);
          spr(GOALTEX[choice], e.x + (GOALP[0] - e.x) * u, e.y + (GOALP[1] - e.y) * u - 110 * Math.sin(Math.PI * u) + oy * (1 - u), Z.tile[0], Z.tile[1], { s: 1 - 0.4 * u });
          if (u > 0.15) L.star(e.x + (GOALP[0] - e.x) * (u - 0.12), e.y + (GOALP[1] - e.y) * (u - 0.12) - 110 * Math.sin(Math.PI * (u - 0.12)), 22, [1, 0.95, 0.6], 0.8 * (1 - u)); }
        else if (a < 0.75) bump = Math.max(bump, 1 - (a - 0.6) / 0.15); }
      const shown = Math.min(K.GOAL, Math.max(0, ST.got - inflight)), txt = shown + '/' + K.GOAL, gp = UI.goal, gs = 1 + 0.1 * bump;
      L.rrect(gp.x + (1 - gs) * gp.w / 2 - 7, gp.y + oy - (gs - 1) * gp.h / 2 - 7, gp.w * gs + 14, gp.h * gs + 14, 47, [0.62, 0.38, 0.16], [0.42, 0.24, 0.08], 0.98);       // brown plank rim
      (bq > 0.6 ? panel : (sl, x, y, w, h, c0, c1, al) => L.rrect(x, y, w, h, 40, c0, c1, al))('goal', gp.x + (1 - gs) * gp.w / 2, gp.y + oy - (gs - 1) * gp.h / 2, gp.w * gs, gp.h * gs, [0.96, 0.86, 0.66], [0.80, 0.60, 0.36], 0.97);
      spr(GOALTEX[choice], GOALP[0], GOALP[1] + oy, Z.tile[0] * 0.9 * gs, Z.tile[1] * 0.9 * gs);
      L.label('goaln', txt, gp.x + 170, gp.y + gp.h / 2 + oy, { size: Math.round(84 * gs), font: FONT, col: shown >= K.GOAL ? '#3fd02a' : '#ff7a1c', out: '#5a2300', a: SS(0.6, 0.85, bq) });          // the panel's text leaves before the panel slides over the CTA bar
      if (bump > 0) L.glow(GOALP[0], GOALP[1] + oy, 120, [1, 0.9, 0.5], 0.5 * bump, 2.2);
      // tutorial hand: the demo finger, or after 2.5 s idle a ghost swipe of the best move
      if (ph === 'board' && bd.busy === 'idle' && bd.best) {
        let hx, hy, down = 0;
        if (ST.demo && ST.inp && ST.inp.press) { hx = ST.inp.px; hy = ST.inp.py; down = 1; }
        else if (ST.demo || (ST.badStreak || 0) >= K.BAD_HINT || GT - Math.max(bd.idleSince, ST.lastIn) > K.HAND_IDLE) { const q = (GT * 0.9) % 1, u = SS(0.2, 0.75, q), [ax, ay] = SIM.cellXY(bd.best.a), [bx, by] = SIM.cellXY(bd.best.b);
          hx = ax + (bx - ax) * u; hy = ay + (by - ay) * u; down = q > 0.1 && q < 0.85; }
        if (hx !== undefined) handAt(hx, hy + oy, down); }
    }

    // ===== reveal FX: magic swirl round her, then the unused wishes come back locked =====
    if (reveal && !ended) {
      const sp = win ? imgPt('bg_room', Z.winAt[0], Z.winAt[1]) : [HERO[0], choice === 'comb' ? HERO[1] - 640 : HERO[1] - 400], R0 = win ? 300 : 330;      // magic swirl closes on the thing she wished for
      if (rt < 1.6) { const q = rt / 1.6, cx = sp[0], cy = sp[1], r = 60 + R0 * (1 - ease(q)), am = Math.sin(Math.PI * Math.min(1, q * 1.1));
        for (let j = 0; j < 18; j++) { const an = j / 18 * 6.283 + rt * 5; L.star(cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.8, 30, [1, 0.92, 0.55], am); }
        L.ring(cx, cy, r, r * 0.8, [1, 0.85, 0.5], 0.5 * am, 0.06); }
      if (choice === 'comb' && rt > 0.5 && rt < 1.3) { const q = (rt - 0.5) / 0.8, hx = HERO[0], hy = HERO[1] - 640, off = -260 + 520 * ease(q), al = Math.sin(Math.PI * q);   // a bright brush stroke sweeps over the hair, then sparkles
        for (let k = 0; k < 3; k++) L.solid(hx + off - 55 + k * 8, hy - 230, 110 - k * 30, 460, [1, 0.97, 0.85], 0.5, 55, 230, 0.34 * al * (k ? 1.4 : 1));
        sparks(hx, hy, Math.min(1, q * 1.2), 16, 230, [1, 0.95, 0.7], 28, 11); }
      for (let j = 0; j < 9; j++) { const q = (rt * 0.45 + j / 9) % 1; L.star(sp[0] + (rnd(j, 2) - 0.5) * 300 + 24 * Math.sin(rt * 3 + j), sp[1] + 100 - 360 * q, 26, [1, 0.85, 0.5], Math.sin(Math.PI * q) * warm); }   // sparkles drifting up from it
      if (rt > 1.4) UI.ORDER.filter((n) => n !== choice).forEach((n, i) => { const b = UI.bubbles[n], k = popk((rt - 1.4 - 0.12 * i) / 0.3) * 0.85, y = b.y + 7 * Math.sin(GT * 3 + i), a = 0.95;
        if (k <= 0.01) return; if (k > 0.5) S.hit.push({ id: 'cta', x: b.x - b.r, y: y - b.r, w: 2 * b.r, h: 2 * b.r });   // the locked wishes are tappable (curiosity → store)
        bubble(b.x, y, b.r * k, a, 0.25); spr(GOALTEX[n], b.x, y, Z.icon[0] * k, Z.icon[1] * k, { a: 0.4 }); lock(b.x + b.r * k * 0.55, y + b.r * k * 0.5, 1, k / 0.85); });
    }

    // ===== captions + callouts =====
    if (!ended) {
      if (ph === 'intro') caption('cap1', shelter ? '...SHE FOUND A SHELTER' : 'KICKED OUT IN THE COLD!', 250, SS(0, 0.25, GT));
      if (ph === 'choice') caption('cap2', 'HELP MIA! PICK ONE', 250, SS(0, 0.25, GT - ST.phaseT));
      if (ph === 'board' && ST.got === 0 && bd && bd.busy === 'idle') caption('cap3', 'SWIPE TO MATCH 3', 250);
      if (reveal && rt > 1.0 && rt < 1.9) caption('capw', choice === 'comb' ? 'LOOKING NEAT AGAIN!' : choice === 'dress' ? 'A WARM NEW DRESS!' : 'NO MORE DRAFT!', 190, SS(1.0, 1.25, rt));
      if (reveal && rt >= 1.9) caption('capn', 'SHE NEEDS MORE...', 190, SS(1.9, 2.15, rt));
    }
    for (const e of ST.ev) { const a = GT - e.t; if (a < 0 || a > 1.1 || ended) continue; const q = a / 1.1;
      const pop = (slot, s, col, out) => L.label(slot, s, W / 2, UI.goal.y - 60 - 50 * ease(q), { size: Math.round(86 * (a < 0.12 ? 0.6 + 3.3 * a : 1)), font: FONT, col, out, al: 0.5, a: 1 - SS(0.7, 1, q) });
      if (e.k === 'cascade') pop('casc', e.n > 2 ? 'AMAZING!' : 'GREAT!', '#fff27a', '#5a3a00'); if (e.k === 'blast') pop('blast', 'SWEET!', '#ffffff', '#1a4a8a'); }
    L.finish(t, { bloom: [0.12, 0.10], vignette: 0.9, warm: 0.5 + 0.3 * warm, roll: 0.5 });

    // ===================== persistent CTA bar =====================
    if (!ended) { const bw = 330, bh = 104, bx = W - bw - 36, by = H - bh - 44, pul = 1 + 0.03 * Math.sin(t * 5);
      L.rrect(24, by - 18, W - 48, bh + 36, 30, [0.06, 0.09, 0.18], [0.03, 0.05, 0.10], 0.72); L.uiBox('ctabar', 24, by - 18, W - 48, bh + 36, 4);
      L.label('brand', 'SNOWBOUND HOME', 66, by + bh / 2, { size: 44, font: FONT, col: '#ffffff', out: '#12305a' });
      L.rrect(bx - (pul - 1) * bw / 2, by - (pul - 1) * bh / 2, bw * pul, bh * pul, bh / 2, [0.45, 0.85, 0.35], [0.20, 0.62, 0.15]); L.uiBox('cta', bx, by, bw, bh, 2);
      L.label('cta', 'PLAY FREE', bx + bw / 2, by + bh / 2, { size: 48, font: FONT, col: '#ffffff', out: '#145a10', al: 0.5 });
      S.hit.push({ id: 'cta', x: bx, y: by, w: bw, h: bh }); }

    // ===================== endcard =====================
    if (ended) { const Y = (v) => v * H / 1920, a = GT - ST.end, k = SS(0, 0.45, a), win = ST.endWhy === 'win', pop = (d) => popk((a - d) / 0.35);
      if (win) L.solid(0, 0, W, H, [0.10, 0.06, 0.04], 0, 0, 0, 0.30 * k); else L.solid(0, 0, W, H, [0.03, 0.05, 0.12], 0, 0, 0, 0.7 * k);       // warm payoff stays warm; the world's hero is hidden (no ghost)
      const si = pop(0.1); if (si > 0.01) { const ix = W / 2, iy = Y(175), r = 82 * si;                                                         // code-drawn app icon
        L.shadow(ix, iy + 14, r * 1.1, r, 0.4); L.rrect(ix - r, iy - r, 2 * r, 2 * r, r * 0.36, [0.55, 0.78, 1], [0.2, 0.38, 0.85]);
        L.solid(ix - r * 0.42, iy - r * 0.05, r * 0.84, r * 0.62, [1, 0.97, 0.9], 0, 0, 0); L.solid(ix - r * 0.43, iy - r * 0.5, r * 0.62, r * 0.62, [0.95, 0.5, 0.25], Math.PI / 4, r * 0.31, r * 0.31);
        L.solid(ix - r * 0.1, iy + r * 0.18, r * 0.2, r * 0.38, [0.6, 0.38, 0.2], 0, 0, 0); L.star(ix + r * 0.55, iy - r * 0.55, r * 0.3, [1, 1, 1], 0.9); }
      const s1 = pop(0.2); if (s1 > 0.01) { L.label('head', win ? 'ONE WISH GRANTED!' : 'MIA STILL NEEDS YOU!', W / 2, Y(330), { size: Math.round(72 * s1), font: FONT, col: '#ffffff', out: '#12305a', al: 0.5 });
        L.label('logo', 'SNOWBOUND HOME', W / 2, Y(430), { size: Math.round(80 * s1), font: FONT, col: '#ffe066', out: '#3a2300', al: 0.5 });
        L.label('tag', win ? 'Help Mia fix everything!' : 'Rebuild her home!', W / 2, Y(515), { size: 54, font: FONT, col: '#ffffff', out: '#12305a', al: 0.5, a: k }); }
      const sm = pop(0.35); if (sm > 0.01) { const sf = win && K.SMILE ? '_smile' : '', n0 = win ? (choice === 'dress' ? 'hero_dress' : choice === 'comb' ? 'hero_comb' : 'hero_sad') : 'hero_sad', n = has(n0 + sf) ? n0 + sf : n0;
        L.glow(W / 2, Y(900), 380, [1, 0.85, 0.4], win ? 0.22 : 0.1, 2.2); L.shadow(W / 2, Y(1245), 380 * sm, 46 * sm, 0.5); spr(n, W / 2, Y(900), 0, 680 * sm * (1 + 0.012 * Math.sin(t * 2.2)));
        if (win) for (let j = 0; j < 8; j++) { const q = (t * 0.6 + j / 8) % 1; L.star(W / 2 + (rnd(j, 1) - 0.5) * 520, Y(1180) - 520 * q, 22, [1, 0.92, 0.55], Math.sin(Math.PI * q) * k); } }
      const s2 = pop(0.45); if (s2 > 0.01) { const st = win ? '6/6 ✓' : ST.got + '/' + K.GOAL, tw = L.labelW('stat', st, { size: 54, font: FONT }) + 70;
        L.rrect(W / 2 - tw / 2, Y(1300) - 46, tw, 92, 46, [0.12, 0.2, 0.1], [0.06, 0.12, 0.05], 0.8 * s2); L.uiBox('statp', W / 2 - tw / 2, Y(1300) - 46, tw, 92, 4);
        L.label('stat', st, W / 2, Y(1300), { size: Math.round(54 * s2), font: FONT, col: '#bff58a', out: '#173307', al: 0.5 }); }
      const s3 = pop(0.7), pul = 1 + 0.045 * Math.sin(t * 6), bw = 640 * s3 * pul, bh = 170 * s3 * pul, bx = W / 2 - bw / 2, by = Y(1480) - bh / 2;
      if (s3 > 0.01) { L.glow(W / 2, Y(1480), 420, [1, 0.8, 0.3], 0.3, 2.2);
        L.rrect(bx, by + 12, bw, bh, bh / 2, [0.15, 0.45, 0.10], [0.10, 0.35, 0.06]); L.rrect(bx, by, bw, bh, bh / 2, [0.55, 0.95, 0.40], [0.25, 0.72, 0.15]); L.uiBox('endcta', bx, by, bw, bh, 2);
        L.label('endcta', 'PLAY FREE', W / 2, by + bh / 2, { size: Math.round(86 * s3), font: FONT, col: '#ffffff', out: '#145a10', al: 0.5 });
        S.hit.push({ id: 'cta', x: bx, y: by, w: bw, h: bh }); }
      if (a > 1.2) { L.label('replay', '↻ REPLAY', W / 2, Y(1710), { size: 46, font: FONT, col: '#ffffff', out: '#12305a', al: 0.5, a: SS(1.2, 1.6, a) });
        S.hit.unshift({ id: 'replay', x: W / 2 - 170, y: Y(1670), w: 340, h: 80 }); }
      if (a > 0.6) S.hit.push({ id: 'cta', x: 0, y: 0, w: W, h: H }); }
  };
  const BY0 = () => UI.grid.y + UI.grid.h / 2;

  // QA hooks: every HUD screen staged from the attract replay where it happens naturally
  S.QA = () => {
    const at = (tt, o = {}) => Object.assign(JSON.parse(JSON.stringify(SIM.at(tt))), o);
    return { states: [['intro_a', at(0.9)], ['intro_b', at(1.8)], ['choice', at(3.2)], ['board', at(4.5)], ['swipe', at(5.0)], ['match', at(5.3)], ['reveal_a', at(7.4)],
      ['reveal_b', at(8.9)], ['reveal_window', at(8.4, { choice: 'window' })], ['reveal_dress', at(8.4, { choice: 'dress' })], ['board_dress', at(5.3, { choice: 'dress' })], ['reveal_smile', at(9.8)], ['end', at(11.5)], ['end_window', at(11.5, { choice: 'window' })], ['end_dress', at(11.5, { choice: 'dress' })], ['goal_worst', at(5.3, { got: 99 })]], cycles: {}, sprites: {}, box: () => [0, 0, W, H] };
  };
})();
