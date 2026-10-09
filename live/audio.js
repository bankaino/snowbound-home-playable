// live/audio.js — procedural sound (WebAudio, zero asset bytes) driven by the sim event bus S.ev.
// index.html calls AUDIO.tick(state) once per frame in play mode. Browsers keep the context 'suspended' until a user gesture (autoplay policy):
// we try to start at load (works in ad-network webviews that allow autoplay → sound from the first frame), otherwise it unlocks on the first
// pointer/touch/key. Events that happened while locked are dropped, so no burst of old sounds on unlock. No on-screen button by design.
// AUDIO.mute(bool) is wired to ad-network viewability / audio-volume callbacks.
(function () {
  let ac = null, out = null, wind = null, last = -1, muted = false, tryAt = -9;
  const PENTA = [523, 587, 659, 784, 880, 1047, 1175, 1319];
  let nbuf = null;
  const noise = () => { if (nbuf) return nbuf; nbuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = nbuf.getChannelData(0);
    let s = 12345; for (let i = 0; i < d.length; i++) { s = (s * 16807) % 2147483647; d[i] = (s / 2147483647) * 2 - 1; } return nbuf; };
  const start = () => {
    if (ac) { if (ac.state !== 'running') ac.resume().then(silence).catch(() => {}); return; }
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    ac = new C(); out = ac.createGain(); out.gain.value = muted ? 0 : 0.55; out.connect(ac.destination);
    // wind: looped noise through a band-pass whose centre drifts (gust) — a cold room under it all
    const s = ac.createBufferSource(); s.buffer = noise(); s.loop = true; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 0.7;
    const g = ac.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(out); s.start(); wind = { g, f };
    if (ac.state !== 'running') ac.resume().then(silence).catch(() => {});
  };
  const silence = () => { try { const b = ac.createBuffer(1, 1, 22050), q = ac.createBufferSource(); q.buffer = b; q.connect(ac.destination); q.start(0); } catch (e) {} };   // iOS: a 1-sample buffer inside the gesture unlocks output
  for (const ev of ['pointerdown', 'touchend', 'click', 'keydown']) addEventListener(ev, start, { capture: true });
  try { start(); } catch (e) {}                                              // allowed in some ad webviews / after a previous gesture; otherwise stays suspended
  const env = (node, t0, a, peak, dur) => { const g = ac.createGain(); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); node.connect(g); g.connect(out); return g; };
  const tone = (freq, t0, dur, type = 'sine', peak = 0.2, slide = 0) => { const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur); env(o, t0, 0.005, peak, dur); o.start(t0); o.stop(t0 + dur + 0.05); };
  const burst = (t0, dur, f0, f1, peak, q = 1.2, type = 'bandpass') => { const s = ac.createBufferSource(); s.buffer = noise(); const f = ac.createBiquadFilter();
    f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur); s.connect(f); env(f, t0, 0.004, peak, dur); s.start(t0); s.stop(t0 + dur + 0.05); };
  const SFX = {
    slam: (t0) => { burst(t0, 0.35, 700, 80, 0.5, 0.8, 'lowpass'); tone(65, t0, 0.5, 'sine', 0.55, 0.45); },       // the door
    intro_cut: (t0) => burst(t0, 0.28, 2400, 300, 0.22, 1.2),                                                    // whip
    bubbles: (t0) => [0, 1, 2].forEach((i) => tone(520 + 140 * i, t0 + 0.12 * i, 0.12, 'sine', 0.16, 1.8)),       // three pops
    choose: (t0) => { tone(660, t0, 0.1, 'triangle', 0.18, 1.5); tone(990, t0 + 0.07, 0.2, 'sine', 0.14); burst(t0, 0.25, 3000, 5000, 0.07, 3); },
    swap: (t0) => burst(t0, 0.1, 900, 2200, 0.1, 1.5),
    bad: (t0) => { tone(150, t0 + 0.14, 0.12, 'square', 0.1, 0.7); tone(130, t0 + 0.27, 0.14, 'square', 0.1, 0.7); },
    match: (t0, e) => { const i = Math.min(PENTA.length - 3, (e.casc || 1) - 1); [0, 1, 2].forEach((j) => tone(PENTA[i + j], t0 + 0.05 * j, 0.22, 'triangle', 0.12)); burst(t0, 0.12, 3500, 1200, 0.06, 2); },
    goal: (t0, e) => { const d = t0 + 0.55 + 0.05 * (e.n % 6); tone(1568, d, 0.18, 'sine', 0.09); tone(2093, d + 0.05, 0.25, 'sine', 0.06); },   // lands when the tile reaches the panel
    blast: (t0) => { tone(220, t0, 0.3, 'sawtooth', 0.1, 5); burst(t0, 0.35, 5000, 400, 0.22, 0.8); },
    cascade: (t0, e) => [0, 1].forEach((j) => tone(PENTA[Math.min(7, 3 + e.n) - j], t0 + 0.12 + 0.07 * j, 0.25, 'square', 0.04)),
    chill: (t0) => { tone(520, t0, 0.7, 'sine', 0.05, 0.6); burst(t0, 0.7, 7000, 3000, 0.07, 3); },                  // a cold shiver
    freeze: (t0) => { burst(t0, 0.3, 9000, 1500, 0.3, 2); tone(2400, t0, 0.35, 'triangle', 0.08, 0.4); },           // ice cracks over her
    shuffle: (t0) => burst(t0, 0.3, 600, 3000, 0.15, 1),
    win: (t0) => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, t0 + i * 0.08, 0.3, 'triangle', 0.14)),
    reveal: (t0) => { [784, 988, 1175, 1568, 1976, 2349].forEach((f, i) => tone(f, t0 + i * 0.09, 0.4, 'sine', 0.09));        // magic swirl
      [1568, 2093].forEach((f, i) => tone(f, t0 + 0.75 + i * 0.12, 0.35, 'triangle', 0.08)); },                                // ta-da
    end: (t0) => [523, 784].forEach((f, i) => tone(f, t0 + i * 0.12, 0.35, 'triangle', 0.08)),
  };
  window.AUDIO = {
    mute: (m) => { muted = m; if (out) out.gain.value = m ? 0 : 0.55; },
    locked: () => !ac || ac.state !== 'running',
    unlock: () => start(),
    tick: (S) => {
      if (!ac || !S) return; const now = ac.currentTime;
      if (S.t < last) last = -1;                                           // restart / replay
      if (ac.state !== 'running') { if (S.t - tryAt > 0.5) { tryAt = S.t; ac.resume().catch(() => {}); } last = Math.max(last, S.t - 0.3); return; }   // locked: only the last 0.3 s may still sound once it unlocks
      for (const e of S.ev) { if (e.t <= last) continue; if (SFX[e.k]) SFX[e.k](now, e); }
      last = S.t;
      const cold = S.end < 0 && S.phase !== 'reveal' ? 1 : S.phase === 'reveal' ? (S.choice === 'window' ? Math.max(0, 1 - (S.t - S.phaseT) / 1.2) : 1) : 0;   // wind dies when the room warms up
      wind.g.gain.setTargetAtTime(0.06 * cold * (0.7 + 0.3 * Math.sin(S.t * 0.9)) * (1 + 1.0 * (S.frost || 0)), now, 0.2); wind.f.frequency.setTargetAtTime(420 + 260 * Math.sin(S.t * 0.7), now, 0.3);
    },
  };
})();
