// headless human-ish players against SIM: how long until the goal / endcard, and does anything get stuck
const S = require('../live/sim.js');
const U = S.UI, N = S.K.COLS * S.K.ROWS;
function lcg(seed) { let a = seed >>> 0; return () => ((a = (Math.imul(a, 1664525) + 1013904223) >>> 0) / 4294967296); }

// policy(p, t, rnd) → null or a gesture { kind:'tap'|'swipe', x0,y0,x1,y1, dur }
function run(policy, seed, opt = {}) {
  const p = S.spawn(0); p.rs = (p.rs + seed * 7919) | 0; const rnd = lcg(seed + 1);
  let g = null, gEnd = 0, nextAt = opt.first || 4.4, idleAt = 0, maxT = 40;
  while (p.t < maxT && p.end < 0) {
    const t = p.t; let inp = { press: 0, px: 0, py: 0 };
    if (!g && t >= nextAt) { g = policy(p, t, rnd); if (g) { g.t0 = t; gEnd = t + g.dur; } else nextAt = t + 0.3; }
    if (g) { const u = Math.min(1, (t - g.t0) / g.dur); inp = { press: t < gEnd + 0.05 ? 1 : 0, px: g.x0 + (g.x1 - g.x0) * u, py: g.y0 + (g.y1 - g.y0) * u };
      if (t >= gEnd + 0.05) { g = null; nextAt = t + (opt.gap || 1.2); } }
    S.step(p, inp);
  }
  const ev = (k) => p.ev.filter((e) => e.k === k);
  const w = ev('win')[0], gl = ev('goal');
  return { win: w ? +w.t.toFixed(1) : null, end: +p.end.toFixed(1), why: p.endWhy, moves: p.moves, bad: ev('bad').length, shuf: ev('shuffle').length, got: p.got, firstGoal: gl[0] ? +gl[0].t.toFixed(1) : null };
}
const bubble = (n) => () => { const b = U.bubbles[n]; return { kind: 'tap', x0: b.x, y0: b.y, x1: b.x, y1: b.y, dur: 0.1 }; };
const swipe = (a, b, dur = 0.3) => { const [ax, ay] = S.cellXY(a), [bx, by] = S.cellXY(b); return { kind: 'swipe', x0: ax, y0: ay, x1: bx, y1: by, dur }; };
const best = (p) => (p.bd && p.bd.busy === 'idle' && p.bd.best) ? swipe(p.bd.best.a, p.bd.best.b) : null;
const randomMove = (p, r) => { if (!(p.bd && p.bd.busy === 'idle')) return null; const a = Math.floor(r() * N), c = a % 5, row = Math.floor(a / 5), opts = []; if (c < 4) opts.push(a + 1); if (c > 0) opts.push(a - 1); if (row < 5) opts.push(a + 5); if (row > 0) opts.push(a - 5); return swipe(a, opts[Math.floor(r() * opts.length)]); };
const policies = {
  // picks a bubble then plays the best move each time
  good: (name) => (p, t, r) => p.phase === 'choice' ? bubble(name)() : best(p),
  // random swaps
  random: (name) => (p, t, r) => p.phase === 'choice' ? bubble(name)() : randomMove(p, r),
  // first move deliberately wasted (random), then best
  badfirst: (name) => (p, t, r) => p.phase === 'choice' ? bubble(name)() : (p.bd && p.moves === 0 && !p.ev.some((e) => e.k === 'bad') && p.bd.busy === 'idle' ? randomMove(p, r) : best(p)),
};

const validMoves = (p) => { const kd = S.kinds(p.bd.cells), out = []; for (let i = 0; i < N; i++) { const c = i % 5, r = Math.floor(i / 5); for (const j of [c < 4 ? i + 1 : -1, r < 5 ? i + 5 : -1]) { if (j < 0 || kd[i] === kd[j]) continue; const k2 = kd.slice(); [k2[i], k2[j]] = [k2[j], k2[i]]; const m = S.findMatches(k2); if (m.n) { let g = 0; for (let x = 0; x < N; x++) if (m.mark[x] && k2[x] === 3) g++; out.push([i, j, g, m.n]); } } } return out; };
policies.validrandom = (name) => (p, t, r) => { if (p.phase === 'choice') return bubble(name)(); if (!(p.bd && p.bd.busy === 'idle')) return null; const v = validMoves(p); if (!v.length) return null; const m = v[Math.floor(r() * v.length)]; return swipe(m[0], m[1]); };
policies.mixed = (name) => (p, t, r) => { if (p.phase === 'choice') return bubble(name)(); if (!(p.bd && p.bd.busy === 'idle')) return null; const v = validMoves(p); if (!v.length) return null; if (r() < 0.5) return best(p); const m = v[Math.floor(r() * v.length)]; return swipe(m[0], m[1]); };
const rows = [];
for (const [pn, mk] of Object.entries(policies)) for (const choice of ['comb']) {
  const rs = []; for (let seed = 1; seed <= (pn === 'good' ? 1 : 30); seed++) rs.push(run(mk(choice), seed, pn === 'good' ? {} : { gap: 1.4 }));
  const wins = rs.filter((x) => x.win !== null), wt = wins.map((x) => x.win).sort((a, b) => a - b);
  rows.push(`${pn.padEnd(8)} ${choice.padEnd(6)} wins ${wins.length}/${rs.length}  winT median ${wt[Math.floor(wt.length / 2)]} p90 ${wt[Math.floor(wt.length * 0.9)]} max ${wt[wt.length - 1]}  moves(avg) ${(rs.reduce((a, x) => a + x.moves, 0) / rs.length).toFixed(1)}  endMax ${Math.max(...rs.map((x) => x.end))}  shuffles ${rs.reduce((a, x) => a + x.shuf, 0)}  ends: ${[...new Set(rs.map((x) => x.why))].join(',')}`);
}
// slow thinker + idle-hand + passive + tap-select
const slow = run(policies.good('comb'), 1, { gap: 3.0, first: 5.0 }); rows.push('slow(3s/move) ' + JSON.stringify(slow));
const idle = run((p) => (p.phase === 'choice' ? bubble('comb')() : null), 1, { first: 3 }); rows.push('taps bubble then idle ' + JSON.stringify(idle));
console.log(rows.join('\n'));
