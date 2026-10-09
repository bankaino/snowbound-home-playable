// draw calls + frame times per phase on the packed build, phone viewport, throttled CPU 4x to imitate a mid-range device
import { createRequire } from 'node:module'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const req = createRequire('C:/Users/artemm/.claude/skills/ref2game/scripts/package.json');
const { chromium } = req('playwright');
const file = path.resolve('dist/default/applovin.html');
const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
await ctx.route('**/mraid.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.mraid={getState:()=>"default",isViewable:()=>true,addEventListener(){},open(){}};' }));
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.argv[2] || 4) });
await p.goto(pathToFileURL(file).href); await p.waitForFunction(() => window.__ready, null, { timeout: 30000 });
const sample = async (label, ms) => p.evaluate(({ label, ms }) => new Promise((res) => { let n = 0, worst = 0, last = performance.now(), dmax = 0; const t0 = last;
  const f = () => { const now = performance.now(); worst = Math.max(worst, now - last); last = now; n++; dmax = Math.max(dmax, G.stats.draws);
    if (now - t0 < ms) requestAnimationFrame(f); else res({ label, fps: +(n / ((now - t0) / 1000)).toFixed(1), worstFrameMs: +worst.toFixed(1), maxDraws: dmax, inst: G.stats.inst, phase: SCENE.state && SCENE.state.phase }); };
  requestAnimationFrame(f); }), { label, ms });
const out = []; out.push(await sample('intro', 1500));
await p.waitForTimeout(1200); out.push(await sample('choice', 1200));
const comb = await p.evaluate(() => SIM.UI.bubbles.comb), box = await p.locator('canvas').boundingBox(), VIEW = await p.evaluate(() => SIM.VIEW);
const V = (x, y) => [box.x + x / VIEW.W * box.width, box.y + y / VIEW.H * box.height];
let [x, y] = V(comb.x, comb.y); await p.mouse.move(x, y); await p.mouse.down(); await p.waitForTimeout(80); await p.mouse.up(); await p.waitForTimeout(900);
out.push(await sample('board idle', 1200));
const best = await p.evaluate(() => SCENE.state.bd.best), [ax, ay] = await p.evaluate((i) => SIM.cellXY(i), best.a), [bx, by] = await p.evaluate((i) => SIM.cellXY(i), best.b);
const [x0, y0] = V(ax, ay), [x1, y1] = V(bx, by); await p.mouse.move(x0, y0); await p.mouse.down(); await p.mouse.move(x1, y1, { steps: 6 }); await p.mouse.up();
out.push(await sample('board clear+fall', 1500));
for (let k = 0; k < 8; k++) { const st = await p.evaluate(() => SCENE.state && { ph: SCENE.state.phase, idle: SCENE.state.bd && SCENE.state.bd.busy === 'idle', best: SCENE.state.bd && SCENE.state.bd.best }); if (!st || st.ph !== 'board') break;
  if (!st.idle) { await p.waitForTimeout(500); continue; } const [a1, a2] = await p.evaluate((i) => SIM.cellXY(i), st.best.a), [b1, b2] = await p.evaluate((i) => SIM.cellXY(i), st.best.b);
  const [s0, s1] = V(a1, a2), [e0, e1] = V(b1, b2); await p.mouse.move(s0, s1); await p.mouse.down(); await p.mouse.move(e0, e1, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(1200); }
out.push(await sample('reveal', 1500)); await p.waitForTimeout(2200); out.push(await sample('endcard', 1200));
console.log(out.map((o) => JSON.stringify(o)).join('\n')); console.log('errors:', errs.length ? errs.join(' | ') : 'none'); await browser.close();
