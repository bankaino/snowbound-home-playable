// live/scene.js — SNOWBOUND HOME. Pure function of t and the sim state (no Math.random, no accumulated state).
// PHASE-1 PLACEHOLDER SCENE: draws every phase of the sim with flat shapes + placeholder sprites so the whole loop is playable and
// testable. Phase 2 replaces the world drawing (intro shots, hero stack, bubbles, board juice, reveal) and keeps S.hit / S.QA / HUD blocks.
(function () {
  const S = (window.SCENE = {}), A = window.ASSETS, L = LIB, M = L.M, W = SIM.VIEW.W, H = SIM.VIEW.H, Z = window.SIZES, K = SIM.K, UI = SIM.UI, SS = L.SS;
  S.programs = () => { L.init(W, H); };
  const has = (n) => !!A[n];
  const FONT = '"Arial Black", "Arial Rounded MT Bold", "Segoe UI Black", sans-serif';
  const ease = (x) => 1 - (1 - x) * (1 - x), clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const popk = (q) => (q <= 0 ? 0 : q < 1 ? 1.12 * ease(q) - 0.12 * q * q : 1);
  const TILE = ['tile_leaf', 'tile_coin', 'tile_yarn'], GOALTEX = { comb: 'tile_comb', window: 'tile_window', dress: 'tile_dress' };
  const GOALP = [UI.goal.x + 84, UI.goal.y + UI.goal.h / 2];                   // where goal tiles land (the panel's icon)
  S.hit = [];

  // sprite helpers (view px)
  const cover = (n, y0 = 0) => { if (!has(n)) return; const tx = G.tex(n), k = Math.max(W / tx.w, H / tx.h), w = tx.w * k, h = tx.h * k; L.sprite(n, (W - w) / 2, (H - h) / 2 + y0, { w, h }); };
  const spr = (n, cx, cy, w, h, o = {}) => { if (!has(n)) return; const s = o.s === undefined ? 1 : o.s; if (s <= 0.01) return;
    if (!w) w = L.hsz(n, h); if (!h) h = w * G.tex(n).h / G.tex(n).w; L.sprite(n, cx - w * s / 2, cy - h * s / 2, { w: w * s, h: h * s, u: { alpha: o.a === undefined ? 1 : o.a } }); };
  const hero = (n, cx, bottom, a = 1) => { if (!has(n)) return; const h = Z[n][1], w = L.hsz(n, h); L.sprite(n, cx - w / 2, bottom - h, { w, h, u: { alpha: a } }); };
  const panel = (slot, x, y, w, h, c0, c1, a = 0.85) => { L.rrect(x, y, w, h, Math.min(h / 2, 40), c0, c1, a); L.uiBox(slot, x, y, w, h, 4); };
  const bubble = (x, y, r, a) => { L.glow(x, y, r * 1.55, [1, 0.95, 0.5], 0.35 * a, 2.2); L.rrect(x - r, y - r, 2 * r, 2 * r, r, [1, 1, 1], [0.86, 0.9, 1], a); };
  const handAt = (hx, hy, down) => { if (down) L.glow(hx, hy, 70, [1, 1, 1], 0.35, 2.5);
    if (has('hand')) { const hh = Z.hand[1] * (down ? 0.92 : 1), hw = L.hsz('hand', hh); L.sprite('hand', hx - hw * 0.33, hy - hh * 0.03, { w: hw, h: hh }); }
    else { L.rrect(hx - 34, hy - 34, 68, 68, 34, [1, 1, 1], [0.86, 0.86, 0.9], 0.9); L.ring(hx, hy, 52, 52, [1, 1, 1], down ? 0.8 : 0.3, 0.12); } };
  const caption = (slot, txt, y, a = 1) => { const tw = L.labelW(slot, txt, { size: 58, font: FONT });
    panel(slot, W / 2 - tw / 2 - 44, y - 56, tw + 88, 112, [0.06, 0.08, 0.16], [0.03, 0.04, 0.10], 0.78 * a);
    L.label(slot, txt, W / 2, y, { size: 58, font: FONT, col: '#ffffff', out: '#0a1a3a', al: 0.5, a }); };

  S.render = (t) => {
    const ST = S.state || SIM.at(t), GT = ST.t, rnd = L.rnd, bd = ST.bd, ph = ST.phase, ended = ST.end >= 0;
    const shelter = ST.cut >= 0 && GT >= ST.cut, reveal = ph === 'reveal' || (ended && ST.endWhy === 'win'), rt = reveal ? GT - (ended ? ST.winT + K.WIN_DELAY : ST.phaseT) : 0;
    const warm = reveal ? SS(0, 1.5, rt) : 0;

    // ===== world =====
    L.beginBG([0.1, 0.12, 0.2, 1]);
    if (!shelter) {                                                              // shot A: outside — the door slams, she is left in the snow
      cover('bg_outside');
      const open = 1 - ease(clamp((GT - 0.45) / 0.25, 0, 1)), sx = 0.15 + 0.85 * (1 - open), dh = Z.door[1], dw = has('door') ? L.hsz('door', dh) : 300;
      if (has('door')) L.sprite('door', 0, 0, { m: M.of(M.t(W * 0.58, H * 0.62), M.s(sx, 1)), w: dw, h: dh, pivot: [0, dh] });
      hero('hero_snow', W * 0.36, H * 0.74, SS(0.6, 1.1, GT));
    } else {                                                                     // shot B: the shelter
      cover('bg_room');
      const sad = reveal && ST.choice === 'window' ? 1 : reveal ? 1 - SS(0.2, 0.8, rt) : 1, cx = W * 0.5 + (reveal ? 0 : 3 * Math.sin(GT * 38)), bot = H * 0.80;
      hero('hero_sad', cx, bot, sad);
      if (reveal && ST.choice === 'comb') hero('hero_happy', cx, bot, SS(0.2, 0.8, rt));
      if (reveal && ST.choice === 'dress') hero('hero_dress', cx, bot, SS(0.2, 0.8, rt));
      if (reveal && ST.choice === 'window') spr('window_patch', W * Z.patchAt[0], H * Z.patchAt[1], Z.window_patch[0], 0, { a: SS(0.2, 0.8, rt) });
    }
    for (let i = 0; i < 40; i++) { const x = (rnd(i, 1) * W + 40 * Math.sin(GT * 0.8 + i)) % W, y = (GT * 130 * (0.5 + rnd(i, 2)) + rnd(i, 3) * H) % H;
      L.puff(x, y, 7 + 6 * rnd(i, 4), [1, 1, 1], 0.55 * (1 - 0.9 * warm), i); }
    L.solid(0, 0, W, H, [0.05, 0.1, 0.3], 0, 0, 0, 0.16 * (1 - warm));          // cold grade → warm grade on the reveal
    L.solid(0, 0, W, H, [1.0, 0.65, 0.25], 0, 0, 0, 0.16 * warm);
    L.beginComp();

    // ===== choice: three bubbles =====
    S.hit = [];
    if (ph === 'choice' || (ph === 'board' && GT - ST.phaseT < 0.55)) {
      UI.ORDER.forEach((n, i) => { const b = UI.bubbles[n]; let k = popk((GT - (ST.phaseT - (ph === 'board' ? 0 : 0)) - 0.12 * i) / 0.3), x = b.x, y = b.y + 9 * Math.sin(GT * 3 + i * 2);
        if (ph === 'board') { const q = clamp((GT - ST.phaseT) / 0.5, 0, 1); k = 1;
          if (n === ST.choice) { x += (GOALP[0] - x) * ease(q); y += (GOALP[1] - y) * ease(q); k = 1 - 0.7 * q; } else k = 1 - q; }
        if (k <= 0.01) return; bubble(x, y, b.r * k, 1); spr(GOALTEX[n], x, y, Z.icon[0] * k, Z.icon[1] * k); });
      if (ph === 'choice') { const b = UI.bubbles.comb, q = (GT * 1.3) % 1, down = q > 0.15 && q < 0.7;
        if (GT - ST.phaseT > 0.5) handAt(b.x + 30, b.y + 50 + (down ? 8 : 0), down); }
    }

    // ===== board =====
    const bq = bd && ph === 'board' ? ease(clamp((GT - ST.phaseT) / K.BOARD_IN, 0, 1)) : bd && reveal ? 1 - ease(clamp((rt - 0.05) / 0.5, 0, 1)) : 0;
    if (bd && bq > 0.001) { const oy = (1 - bq) * (H - UI.board.y + 40);
      L.solid(0, 0, W, H, [0.02, 0.04, 0.1], 0, 0, 0, 0.45 * bq);
      L.rrect(UI.board.x, UI.board.y + oy, UI.board.w, UI.board.h, 34, [0.16, 0.28, 0.55], [0.08, 0.16, 0.38], 0.97);
      L.rrect(UI.grid.x - 6, UI.grid.y + oy - 6, UI.grid.w + 12, UI.grid.h + 12, 26, [0.12, 0.22, 0.46], [0.10, 0.2, 0.42], 1);
      bd.cells.forEach((c, i) => { const [cx, cy] = SIM.cellXY(i), q = c.clr >= 0 ? clamp((GT - c.clr) / K.CLEAR_T, 0, 1) : 0; if (q >= 1) return;
        const sel = ST.sel === i ? 1.12 : 1, bad = ST.ev.some((e) => e.k === 'bad' && (e.a === i || e.b === i) && GT - e.t < 0.3 && GT - e.t > K.SWAP_T) ? 8 * Math.sin(GT * 90) : 0;
        spr(c.k === 3 ? GOALTEX[ST.choice || 'comb'] : TILE[c.k], cx + c.ox + bad, cy + c.oy + c.fy + oy, Z.tile[0], Z.tile[1], { s: sel * (1 + 0.25 * q), a: 1 - q }); });
      if (ST.sel >= 0) { const [cx, cy] = SIM.cellXY(ST.sel); L.ring(cx, cy + oy, 92, 92, [1, 1, 1], 0.7, 0.08); }
      // goal panel: icon + counter; counter counts tiles that have landed
      let inflight = 0; for (const e of ST.ev) { const a = GT - e.t - 0.02 * (e.n % 3); if (e.k === 'goal' && a >= 0 && a < 0.6) { inflight++; const u = ease(a / 0.6);
        spr(GOALTEX[ST.choice || 'comb'], e.x + (GOALP[0] - e.x) * u, e.y + (GOALP[1] - e.y) * u, Z.tile[0], Z.tile[1], { s: 1 - 0.4 * u }); } }
      const shown = Math.min(K.GOAL, Math.max(0, ST.got - inflight)), txt = shown + '/' + K.GOAL, gp = UI.goal;
      panel('goal', gp.x, gp.y + oy, gp.w, gp.h, [0.96, 0.86, 0.66], [0.80, 0.60, 0.36], 0.97);
      spr(GOALTEX[ST.choice || 'comb'], GOALP[0], GOALP[1] + oy, Z.tile[0] * 0.9, Z.tile[1] * 0.9);
      L.label('goaln', txt, gp.x + 170, gp.y + gp.h / 2 + oy, { size: 84, font: FONT, col: '#ff7a1c', out: '#5a2300' });
      // tutorial hand: the demo finger, or after 2.5 s idle a ghost swipe of the best move
      if (ph === 'board' && bd.busy === 'idle' && bd.best) {
        let hx, hy, down = 0;
        if (ST.demo && ST.inp && ST.inp.press) { hx = ST.inp.px; hy = ST.inp.py; down = 1; }
        else if (ST.demo || GT - Math.max(bd.idleSince, ST.lastIn) > K.HAND_IDLE) { const q = (GT * 0.9) % 1, u = SS(0.2, 0.75, q), [ax, ay] = SIM.cellXY(bd.best.a), [bx, by] = SIM.cellXY(bd.best.b);
          hx = ax + (bx - ax) * u; hy = ay + (by - ay) * u; down = q > 0.1 && q < 0.85; }
        if (hx !== undefined) handAt(hx, hy + oy, down); }
    }

    // ===== captions =====
    if (!ended) {
      if (ph === 'intro') caption('cap1', shelter ? '...SHE FOUND A SHELTER' : 'KICKED OUT IN THE COLD!', 250, SS(0, 0.25, GT));
      if (ph === 'choice') caption('cap2', 'HELP MIA! PICK ONE', 250, SS(0, 0.25, GT - ST.phaseT));
      if (ph === 'board' && ST.got === 0 && bd && bd.busy === 'idle') caption('cap3', 'SWIPE TO MATCH 3', 250);
    }
    for (const e of ST.ev) { const a = GT - e.t; if (a < 0 || a > 1.1) continue; const q = a / 1.1;
      const pop = (slot, s) => L.label(slot, s, W / 2, e.y - 120 * ease(q), { size: 86, font: FONT, col: '#fff27a', out: '#5a3a00', al: 0.5, a: 1 - SS(0.7, 1, q) });
      if (e.k === 'cascade') pop('casc', e.n > 2 ? 'AMAZING!' : 'GREAT!'); if (e.k === 'blast') pop('blast', 'SWEET!'); }
    if (reveal && rt > 1.5 && !ended) caption('capw', 'MIA FEELS WARM AGAIN!', 250, SS(1.5, 1.8, rt));
    L.finish(t, { bloom: [0.12, 0.10], vignette: 0.9, warm: 0.5 + 0.3 * warm, roll: 0.5 });

    // ===================== persistent CTA bar =====================
    if (!ended) { const bw = 330, bh = 104, bx = W - bw - 36, by = H - bh - 44, pul = 1 + 0.03 * Math.sin(t * 5);
      L.rrect(24, by - 18, W - 48, bh + 36, 30, [0.06, 0.09, 0.18], [0.03, 0.05, 0.10], 0.72); L.uiBox('ctabar', 24, by - 18, W - 48, bh + 36, 4);
      L.label('brand', 'SNOWBOUND HOME', 66, by + bh / 2, { size: 44, font: FONT, col: '#ffffff', out: '#12305a' });
      L.rrect(bx - (pul - 1) * bw / 2, by - (pul - 1) * bh / 2, bw * pul, bh * pul, bh / 2, [0.45, 0.85, 0.35], [0.20, 0.62, 0.15]); L.uiBox('cta', bx, by, bw, bh, 2);
      L.label('cta', 'PLAY FREE', bx + bw / 2, by + bh / 2, { size: 48, font: FONT, col: '#ffffff', out: '#145a10', al: 0.5 });
      S.hit.push({ id: 'cta', x: bx, y: by, w: bw, h: bh }); }

    // ===================== endcard =====================
    if (ended) { const oy = (H - 1920) / 2, a = GT - ST.end, k = SS(0, 0.45, a), win = ST.endWhy === 'win', pop = (d) => popk((a - d) / 0.35);
      L.solid(0, 0, W, H, [0.03, 0.05, 0.12], 0, 0, 0, 0.72 * k);
      const s1 = pop(0.2); if (s1 > 0.01) { L.label('head', win ? "SHE'S SMILING AGAIN!" : 'MIA STILL NEEDS YOU!', W / 2, 230 + oy, { size: Math.round(66 * s1), font: FONT, col: '#ffffff', out: '#12305a', al: 0.5 });
        L.label('logo', 'SNOWBOUND HOME', W / 2, 350 + oy, { size: Math.round(80 * s1), font: FONT, col: '#ffe066', out: '#3a2300', al: 0.5 });
        L.label('tag', 'Rebuild her home!', W / 2, 460 + oy, { size: 54, font: FONT, col: '#ffffff', out: '#12305a', al: 0.5, a: k }); }
      const sm = pop(0.35); if (sm > 0.01) { const n = win ? (ST.choice === 'dress' ? 'hero_dress' : ST.choice === 'window' ? 'hero_sad' : 'hero_happy') : 'hero_sad';
        L.glow(W / 2, 820 + oy, 330, [1, 0.85, 0.4], 0.25, 2.2); spr(n, W / 2, 800 + oy, 0, 560 * sm * (1 + 0.012 * Math.sin(t * 2.2))); }
      const s2 = pop(0.45); if (s2 > 0.01) L.label('stat', win ? '6/6 ✓' : ST.got + '/' + K.GOAL, W / 2, 1130 + oy, { size: Math.round(60 * s2), font: FONT, col: '#bff58a', out: '#173307', al: 0.5 });
      const s3 = pop(0.7), pul = 1 + 0.045 * Math.sin(t * 6), bw = 640 * s3 * pul, bh = 170 * s3 * pul, bx = W / 2 - bw / 2, by = 1330 + oy - bh / 2;
      if (s3 > 0.01) { L.glow(W / 2, 1330 + oy, 420, [1, 0.8, 0.3], 0.3, 2.2);
        L.rrect(bx, by + 12, bw, bh, bh / 2, [0.15, 0.45, 0.10], [0.10, 0.35, 0.06]); L.rrect(bx, by, bw, bh, bh / 2, [0.55, 0.95, 0.40], [0.25, 0.72, 0.15]); L.uiBox('endcta', bx, by, bw, bh, 2);
        L.label('endcta', 'PLAY FREE', W / 2, by + bh / 2, { size: Math.round(86 * s3), font: FONT, col: '#ffffff', out: '#145a10', al: 0.5 });
        S.hit.push({ id: 'cta', x: bx, y: by, w: bw, h: bh }); }
      if (a > 1.2) { L.label('replay', '↻ REPLAY', W / 2, 1560 + oy, { size: 46, font: FONT, col: '#ffffff', out: '#12305a', al: 0.5, a: SS(1.2, 1.6, a) });
        S.hit.unshift({ id: 'replay', x: W / 2 - 170, y: 1520 + oy, w: 340, h: 80 }); }
      if (a > 0.6) S.hit.push({ id: 'cta', x: 0, y: 0, w: W, h: H }); }
  };

  // QA hooks: every HUD screen staged from the attract replay where it happens naturally
  S.QA = () => {
    const at = (tt, o = {}) => Object.assign(JSON.parse(JSON.stringify(SIM.at(tt))), o);
    return { states: [['intro_a', at(0.9)], ['intro_b', at(1.8)], ['choice', at(3.2)], ['board', at(4.5)], ['swipe', at(5.0)], ['match', at(5.3)], ['reveal', at(8.4)], ['end', at(10.8)],
      ['goal_worst', at(5.3, { got: 99 })]], cycles: {}, sprites: {}, box: () => [0, 0, W, H] };
  };
})();
