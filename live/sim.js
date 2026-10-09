// live/sim.js — SNOWBOUND HOME playable ad: deterministic story + match-3 sim, fixed 120 Hz.
// Flow: intro (kicked out → shelter) → choice (3 bubbles) → board (swap to collect K.GOAL goal tiles) → reveal → endcard.
// Every reaction lives here as timed state / events (S.ev); the scene only draws and interpolates.
(function (root) {
  const DT = 1 / 120, L = 20.0;
  const ASPECT = typeof window !== 'undefined' && window.innerWidth ? window.innerHeight / window.innerWidth : 16 / 9;
  const VIEW = { W: 1080, H: Math.round(1080 * Math.max(16 / 9, Math.min(19.5 / 9, ASPECT))) }, W = VIEW.W, H = VIEW.H;
  const HINT = 'click a bubble · drag a tile onto its neighbour to match 3 · collect 6';
  const K = {
    COLS: 5, ROWS: 6, CELL: 170, GOAL: 6, GOAL_BIAS: 0.30, GOAL_MIN: 3,        // grid, goal count, refill bias, min goal tiles kept on the board
    SWIPE_PX: 60, SWAP_T: 0.14, CLEAR_T: 0.18, FALL_G: 5200, BOUNCE: 0.22,
    INTRO_CUT: 1.2, INTRO_END: 2.2, AUTO_PICK: 4, BOARD_IN: 0.7, HAND_IDLE: 2.5, WIN_DELAY: 0.35, REVEAL_T: 2.8,
    END_MAX: 28, END_NO_INPUT: 12, END_IDLE: 10,
    DEMO_CHOOSE: 3.5, DEMO_THINK: 0.55, DEMO_SWIPE: 0.4,
  };
  const N = K.COLS * K.ROWS, GOALK = 3;                                         // tile kinds: 0 leaf, 1 coin, 2 yarn, 3 GOAL (comb | window | dress)
  const KIND = { L: 0, C: 1, Y: 2, G: 3 };
  // start board: no matches; found by a seeded search so the hinted first swap clears ≥4 goal tiles and the next swap finishes the goal
  // (demo wins at ≈6.6 s with 2 moves). Rows top → bottom; L leaf, C coin, Y yarn, G goal tile.
  const START = ['YGYCL', 'LLGYC', 'LYYGL', 'CYLCG', 'CGGYG', 'LCGGL'];

  // ---------------- layout (shared by scene, smoke test and demo) ----------------
  const BX = (W - K.COLS * K.CELL) / 2, BY = Math.round(H * 0.30), GW = K.COLS * K.CELL, GH = K.ROWS * K.CELL;
  const cellXY = (i) => [BX + (i % K.COLS + 0.5) * K.CELL, BY + (Math.floor(i / K.COLS) + 0.5) * K.CELL];
  const cellAt = (x, y) => { const c = Math.floor((x - BX) / K.CELL), r = Math.floor((y - BY) / K.CELL); return c < 0 || r < 0 || c >= K.COLS || r >= K.ROWS ? -1 : r * K.COLS + c; };
  const UI = {
    grid: { x: BX, y: BY, w: GW, h: GH }, board: { x: BX - 24, y: BY - 24, w: GW + 48, h: GH + 48 },
    goal: { x: W / 2 - 250, y: BY - 24 - 190, w: 500, h: 150 },
    bubbles: { window: { x: W * 0.50, y: H * 0.20, r: 135 }, comb: { x: W * 0.80, y: H * 0.32, r: 135 }, dress: { x: W * 0.22, y: H * 0.43, r: 135 } },
    ORDER: ['window', 'comb', 'dress'], cellXY, cellAt,
  };

  // ---------------- board logic (pure functions on kind arrays) ----------------
  // runs of ≥3 clear; a run of ≥4 blasts its whole row / column
  function findMatches(kd) {
    const mark = new Uint8Array(N), blasts = [], C = K.COLS, R = K.ROWS;
    for (let r = 0; r < R; r++) for (let c = 0; c < C;) { const k = kd[r * C + c]; let e = c + 1; while (k >= 0 && e < C && kd[r * C + e] === k) e++;
      if (k >= 0 && e - c >= 3) { for (let j = c; j < e; j++) mark[r * C + j] = 1; if (e - c >= 4) { blasts.push({ row: r }); for (let j = 0; j < C; j++) mark[r * C + j] = 1; } } c = e; }
    for (let c = 0; c < C; c++) for (let r = 0; r < R;) { const k = kd[r * C + c]; let e = r + 1; while (k >= 0 && e < R && kd[e * C + c] === k) e++;
      if (k >= 0 && e - r >= 3) { for (let j = r; j < e; j++) mark[j * C + c] = 1; if (e - r >= 4) { blasts.push({ col: c }); for (let j = 0; j < R; j++) mark[j * C + c] = 1; } } r = e; }
    let n = 0; for (let i = 0; i < N; i++) n += mark[i];
    return { mark, blasts, n };
  }
  // the swap that clears the most goal tiles, then the most tiles (first wins ties); null when the board is stuck
  function bestMove(kd) {
    let best = null; const k2 = Array.from(kd);
    for (let i = 0; i < N; i++) { const c = i % K.COLS, r = Math.floor(i / K.COLS);
      for (const j of [c < K.COLS - 1 ? i + 1 : -1, r < K.ROWS - 1 ? i + K.COLS : -1]) { if (j < 0 || k2[i] === k2[j]) continue;
        [k2[i], k2[j]] = [k2[j], k2[i]]; const m = findMatches(k2); let g = 0; if (m.n) for (let x = 0; x < N; x++) if (m.mark[x] && k2[x] === GOALK) g++;
        [k2[i], k2[j]] = [k2[j], k2[i]];
        if (m.n && (!best || g * 100 + m.n > best.goal * 100 + best.tiles)) best = { a: i, b: j, goal: g, tiles: m.n }; } }
    return best;
  }
  const kinds = (cells) => cells.map((c) => (c.clr >= 0 ? -1 : c.k));

  const rnd = (S) => { S.rs = (S.rs + 0x6D2B79F5) | 0; let t = Math.imul(S.rs ^ (S.rs >>> 15), 1 | S.rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const mk = (S, k) => ({ k, fy: 0, vy: 0, ox: 0, oy: 0, clr: -1, bn: 0, id: S.nid++ });

  function createBoard(S) {
    const cells = []; for (let r = 0; r < K.ROWS; r++) for (let c = 0; c < K.COLS; c++) cells.push(mk(S, KIND[START[r][c]]));
    return { cells, busy: 'in', t0: S.t, readyAt: S.t + K.BOARD_IN, sw: null, casc: 0, idleSince: -9, best: null };
  }
  function create() {
    return { t: 0, steps: 0, wt0: 0, ev: [], phase: 'intro', phaseT: 0, cut: -1, choice: '', auto: false, bd: null, got: 0, money: 0, earned: 0, moves: 0,
      end: -1, endWhy: '', winT: -9, firstIn: -1, lastIn: 0, prevPress: false, drag: null, sel: -1, rs: 20241009, nid: 0 };
  }
  const spawn = (worldT) => Object.assign(create(), { wt0: worldT });
  const respawn = (S, worldT) => spawn(worldT);
  const outOfPlay = () => false;

  const centre = (S, mark) => { let x = 0, y = 0, n = 0; for (let i = 0; i < N; i++) if (mark[i]) { const p = cellXY(i); x += p[0]; y += p[1]; n++; } return n ? [x / n, y / n] : [W / 2, BY]; };
  function setIdle(S) {
    const bd = S.bd; bd.busy = 'idle'; bd.idleSince = S.t; bd.casc = 0; bd.sw = null;
    if (!bestMove(kinds(bd.cells))) {                                           // stuck board → deterministic reshuffle
      for (let tries = 0; tries < 200; tries++) { const kd = bd.cells.map((c) => c.k);
        for (let i = N - 1; i > 0; i--) { const j = Math.floor(rnd(S) * (i + 1)); [kd[i], kd[j]] = [kd[j], kd[i]]; }
        if (!findMatches(kd).n && bestMove(kd)) { bd.cells.forEach((c, i) => { c.k = kd[i]; }); S.ev.push({ k: 'shuffle', t: S.t }); break; } } }
    bd.best = bestMove(kinds(bd.cells));
  }
  function beginClear(S, m) {
    const bd = S.bd, t = S.t; bd.casc++; let ng = 0;
    for (let i = 0; i < N; i++) if (m.mark[i]) { const c = bd.cells[i]; c.clr = t;
      if (c.k === GOALK) { ng++; S.got++; S.money = S.earned = S.got; const [x, y] = cellXY(i); S.ev.push({ k: 'goal', t, x, y, n: S.got, i }); } }
    const [cx, cy] = centre(S, m.mark);
    S.ev.push({ k: 'match', t, n: m.n, ng, casc: bd.casc, x: cx, y: cy });
    for (const b of m.blasts) S.ev.push({ k: 'blast', t, row: b.row, col: b.col, x: b.row !== undefined ? W / 2 : cellXY(b.col)[0], y: b.row !== undefined ? cellXY(b.row * K.COLS)[1] : BY + GH / 2 });
    if (bd.casc > 1) S.ev.push({ k: 'cascade', t, n: bd.casc, x: cx, y: cy });
    bd.busy = 'clear'; bd.t0 = t;
  }
  function removeAndFall(S) {
    const bd = S.bd, t = S.t, C = K.COLS, R = K.ROWS, cells = bd.cells;
    if (S.got >= K.GOAL) { bd.busy = 'won'; bd.t0 = t; S.winT = t; S.ev.push({ k: 'win', t }); return; }
    const keep = []; let goals = 0;
    for (let c = 0; c < C; c++) { const col = []; for (let r = R - 1; r >= 0; r--) { const cl = cells[r * C + c]; if (cl.clr < 0) { col.push([cl, r]); if (cl.k === GOALK) goals++; } } keep.push(col); }
    const fresh = [];                                                           // pass 1: survivors drop to the bottom of their column, new slots stay empty
    for (let c = 0; c < C; c++) { const col = keep[c], n = R - col.length;
      col.forEach(([cl, r], j) => { cells[(R - 1 - j) * C + c] = cl; cl.fy += (r - (R - 1 - j)) * K.CELL; });
      for (let j = n - 1; j >= 0; j--) { cells[j * C + c] = null; fresh.push([j, c, n]); } }
    const runs = (r, c, k, dr, dc) => { let m = 0; for (let x = 1; x < 3; x++) { const rr = r + dr * x, cc = c + dc * x; const o = rr < 0 || cc < 0 || rr >= R || cc >= C ? null : cells[rr * C + cc]; if (!o || o.k !== k) break; m++; } return m; };
    const makes3 = (r, c, k) => runs(r, c, k, 0, -1) + runs(r, c, k, 0, 1) >= 2 || runs(r, c, k, -1, 0) + runs(r, c, k, 1, 0) >= 2;
    for (const [j, c, n] of fresh) {                                           // pass 2: refill without handing out free matches (cascades come from the board, not from luck)
      const q = rnd(S), q2 = rnd(S); let k = goals < K.GOAL_MIN || q < K.GOAL_BIAS ? GOALK : Math.floor(q2 * 3);
      for (let tries = 0; tries < 4 && makes3(j, c, k); tries++) k = (k + 1) % 4;
      if (k === GOALK) goals++;
      const cl = mk(S, k); cl.fy = -n * K.CELL; cells[j * C + c] = cl; }
    bd.busy = 'fall'; bd.t0 = t;
  }
  function startSwap(S, a, b) { const bd = S.bd; bd.busy = 'swap'; bd.t0 = S.t; bd.sw = { a, b }; S.ev.push({ k: 'swap', t: S.t, a, b }); }
  const neighbour = (c, dx, dy) => { const col = c % K.COLS, row = Math.floor(c / K.COLS);
    if (Math.abs(dx) >= Math.abs(dy)) { const n = col + Math.sign(dx); return n < 0 || n >= K.COLS ? -1 : c + Math.sign(dx); }
    const n = row + Math.sign(dy); return n < 0 || n >= K.ROWS ? -1 : c + Math.sign(dy) * K.COLS; };

  function stepBoard(S, inp, edge, rel, press) {
    const bd = S.bd, t = S.t, cells = bd.cells, idle = bd.busy === 'idle';
    if (edge) S.drag = idle ? (() => { const c = cellAt(inp.px, inp.py); return c >= 0 ? { c, x0: inp.px, y0: inp.py, done: false } : null; })() : null;
    if (press && S.drag && !S.drag.done && idle) { const dx = inp.px - S.drag.x0, dy = inp.py - S.drag.y0;
      if (Math.hypot(dx, dy) >= K.SWIPE_PX) { S.drag.done = true; const n = neighbour(S.drag.c, dx, dy); S.sel = -1; if (n >= 0) startSwap(S, S.drag.c, n); } }
    if (rel) { const d = S.drag; S.drag = null;
      if (d && !d.done && bd.busy === 'idle') {                                  // a tap: select, then tap a neighbour
        const c = d.c, adj = S.sel >= 0 && Math.abs((c % K.COLS) - (S.sel % K.COLS)) + Math.abs(Math.floor(c / K.COLS) - Math.floor(S.sel / K.COLS)) === 1;
        if (adj) { const a = S.sel; S.sel = -1; startSwap(S, a, c); } else S.sel = c === S.sel ? -1 : c; } }
    const u = Math.min(1, (t - bd.t0) / K.SWAP_T), e = u * u * (3 - 2 * u);
    switch (bd.busy) {
      case 'in': if (t >= bd.readyAt) setIdle(S); break;
      case 'swap': { const { a, b } = bd.sw, pa = cellXY(a), pb = cellXY(b);
        cells[a].ox = (pb[0] - pa[0]) * e; cells[a].oy = (pb[1] - pa[1]) * e; cells[b].ox = (pa[0] - pb[0]) * e; cells[b].oy = (pa[1] - pb[1]) * e;
        if (u >= 1) { const k2 = kinds(cells); [k2[a], k2[b]] = [k2[b], k2[a]]; const m = findMatches(k2);
          if (m.n) { [cells[a], cells[b]] = [cells[b], cells[a]]; cells[a].ox = cells[a].oy = cells[b].ox = cells[b].oy = 0; S.moves++; bd.casc = 0; beginClear(S, m); }
          else { bd.busy = 'back'; bd.t0 = t; const [x, y] = pa; S.ev.push({ k: 'bad', t, a, b, x, y }); } } break; }
      case 'back': { const { a, b } = bd.sw, pa = cellXY(a), pb = cellXY(b), f = 1 - e;
        cells[a].ox = (pb[0] - pa[0]) * f; cells[a].oy = (pb[1] - pa[1]) * f; cells[b].ox = (pa[0] - pb[0]) * f; cells[b].oy = (pa[1] - pb[1]) * f;
        if (t - bd.t0 >= K.SWAP_T) { cells[a].ox = cells[a].oy = cells[b].ox = cells[b].oy = 0; setIdle(S); } break; }
      case 'clear': if (t - bd.t0 >= K.CLEAR_T) removeAndFall(S); break;
      case 'fall': { let moving = false;
        for (const c of cells) if (c.fy !== 0 || c.vy !== 0) { moving = true; c.vy += K.FALL_G * DT; c.fy += c.vy * DT;
          if (c.fy >= 0) { c.fy = 0; if (c.vy > 350 && !c.bn) { c.vy = -c.vy * K.BOUNCE; c.bn = 1; } else { c.vy = 0; c.bn = 0; } } }
        if (!moving) { const m = findMatches(kinds(cells)); if (m.n) beginClear(S, m); else setIdle(S); } break; }
      case 'won': if (t - bd.t0 >= K.WIN_DELAY) { S.phase = 'reveal'; S.phaseT = t; S.ev.push({ k: 'reveal', t, choice: S.choice }); } break;
    }
  }
  const endGame = (S, why) => { S.end = S.t; S.endWhy = why; S.ev.push({ k: 'end', t: S.t, why }); };
  function toChoice(S) {
    if (S.cut < 0) { S.cut = S.t; S.ev.push({ k: 'intro_cut', t: S.t }); }
    S.phase = 'choice'; S.phaseT = S.t; S.ev.push({ k: 'bubbles', t: S.t });
  }

  function step(S, inp) {
    const t = S.t + DT; S.t = t; S.steps++;
    if (S.ev.length > 220) S.ev.splice(0, S.ev.length - 220);
    const press = !!inp.press, edge = press && !S.prevPress, rel = !press && S.prevPress; S.prevPress = press;
    if (press) { S.lastIn = t; if (S.firstIn < 0) S.firstIn = t; }
    if (S.end >= 0) return S;
    if (S.phase === 'intro') {
      if (S.cut < 0 && t >= K.INTRO_CUT) { S.cut = t; S.ev.push({ k: 'intro_cut', t }); }
      if (edge || t >= K.INTRO_END) toChoice(S);                                 // any tap skips the story
    } else if (S.phase === 'choice') {
      let pick = '';
      if (edge && t - S.phaseT > 0.2) for (const n of UI.ORDER) { const b = UI.bubbles[n]; if (Math.hypot(inp.px - b.x, inp.py - b.y) <= b.r + 20) { pick = n; break; } }
      const auto = !pick && t - Math.max(S.phaseT, S.lastIn) > K.AUTO_PICK;      // nobody tapped: the comb is chosen so a passive viewer still sees the game
      if (pick || auto) { S.choice = pick || 'comb'; S.auto = auto; S.phase = 'board'; S.phaseT = t; S.bd = createBoard(S); S.ev.push({ k: 'choose', t, kind: S.choice, auto }); }
    } else if (S.phase === 'board') stepBoard(S, inp, edge, rel, press);
    else if (S.phase === 'reveal' && t - S.phaseT >= K.REVEAL_T) endGame(S, 'win');
    if (S.end < 0 && S.phase !== 'reveal' && !(S.bd && S.bd.busy === 'won')) {
      const why = S.firstIn >= 0 && t - S.firstIn > K.END_MAX ? 'time' : S.firstIn < 0 && t > K.END_NO_INPUT ? 'time' : S.firstIn >= 0 && t - S.lastIn > K.END_IDLE ? 'time' : '';
      if (why) endGame(S, why);
    }
    return S;
  }

  // ---- attract demo: a planner that plays the ad like a good player, expressed as a finger (the scene draws the hand). Pure in (t, S). ----
  const scriptInput = (t, S) => {
    const inp = { press: 0, px: W / 2, py: H / 2 };
    if (S.end >= 0) return inp;
    if (S.phase === 'choice') { const b = UI.bubbles.comb; inp.px = b.x; inp.py = b.y; if (t >= K.DEMO_CHOOSE && t < K.DEMO_CHOOSE + 0.15) inp.press = 1; }
    else if (S.phase === 'board' && S.bd.busy === 'idle' && S.bd.best) {
      const u = (t - S.bd.idleSince - K.DEMO_THINK) / K.DEMO_SWIPE, [ax, ay] = cellXY(S.bd.best.a), [bx, by] = cellXY(S.bd.best.b), k = Math.max(0, Math.min(1, u));
      inp.px = ax + (bx - ax) * k; inp.py = ay + (by - ay) * k; if (u >= 0 && u <= 1.15) inp.press = 1;
    }
    return inp;
  };
  let cache = null;
  function at(t) {
    const loop = Math.floor(t / L), q = t - loop * L, n = Math.round(q / DT);
    if (!cache || cache.loop !== loop || cache.S.steps > n) { const S0 = Object.assign(create(), { wt0: loop * L }); cache = { loop, S: S0 }; }
    const S = cache.S; while (S.steps < n) step(S, scriptInput(S.t, S));
    return Object.assign({}, S, { loop, q, demo: true, inp: scriptInput(S.t, S) });
  }
  // the demo must hit every beat of the ad inside its loop
  const demoCheck = (S) => { const first = (k) => S.ev.find((e) => e.k === k), f = [];
    const ch = first('choose'), g = first('goal'), w = first('win');
    if (!first('intro_cut')) f.push('no story cut'); if (!ch || ch.t > 4.5) f.push('choice late: ' + (ch ? ch.t.toFixed(1) : 'never'));
    if (!g || g.t > 8) f.push('first goal late: ' + (g ? g.t.toFixed(1) : 'never'));
    if (S.ev.filter((e) => e.k === 'goal' && e.t < 7).length < 4) f.push('< 4 goals by 7 s');
    if (!w || w.t > 11) f.push('win late: ' + (w ? w.t.toFixed(1) : 'never'));
    if (S.end < 0 || S.end > 15) f.push('endcard late: ' + S.end.toFixed(1)); if (S.endWhy !== 'win') f.push('endWhy ' + S.endWhy);
    if (S.ev.some((e) => e.k === 'bad')) f.push('demo made a bad move'); return f; };

  root.SIM = { DT, L, K, VIEW, HINT, UI, START, KIND, cellXY, cellAt, findMatches, bestMove, kinds, create, spawn, respawn, outOfPlay, step, at, scriptInput, demoCheck };
  if (typeof module !== 'undefined') module.exports = root.SIM;
})(typeof window !== 'undefined' ? window : globalThis);
