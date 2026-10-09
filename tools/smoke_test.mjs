// smoke_test.mjs — plays a built single-file playable headless, like a QA tester on a phone would.
//   node tools/smoke_test.mjs [dist/default/applovin.html] [--shots dir]
// Mobile viewport + touch, a stub MRAID container that records mraid.open, taps the comb bubble and swipes tiles, a tap
// on the persistent CTA. Fails (exit 1) on: page errors, any network request other than mraid.js, no goal tiles collected,
// CTA not reaching mraid.open, fps below 50.
import { createRequire } from 'node:module'; import path from 'node:path'; import fs from 'node:fs'; import { pathToFileURL } from 'node:url';
const req = createRequire(import.meta.url);
const { chromium } = req(process.env.PLAYWRIGHT || 'playwright');
const file = path.resolve(process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'dist/default/applovin.html');
const si = process.argv.indexOf('--shots'), shots = si > 0 ? process.argv[si + 1] : 'frames/smoke'; fs.mkdirSync(shots, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const errors = [], external = [];
ctx.on('request', (r) => { const u = r.url(); if (!u.startsWith('data:') && !u.startsWith('file:')) external.push(u); });
await ctx.route('**/mraid.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: `
  window.mraid = { _l: {}, opened: [], getState: () => 'default', isViewable: () => true,
    addEventListener(k, f) { (this._l[k] = this._l[k] || []).push(f); }, open(u) { this.opened.push(u); } };` }));
const p = await ctx.newPage();
p.on('pageerror', (e) => errors.push(String(e))); p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await p.goto(pathToFileURL(file).href);
try { await p.waitForFunction(() => window.__ready, null, { timeout: 20000 }); }
catch (e) { console.log(JSON.stringify({ file: path.basename(file), fails: ['did not boot: ' + (errors.join(' | ') || e.message)] })); await browser.close(); process.exit(1); }
await p.waitForTimeout(600); await p.screenshot({ path: path.join(shots, '0_start.png') });
const box = await p.locator('canvas').boundingBox(), VIEW = await p.evaluate(() => SIM.VIEW);
const V = (x, y) => [box.x + x / VIEW.W * box.width, box.y + y / VIEW.H * box.height];
// play like a tester: tap the COMB bubble, then swipe the best move twice (SIM.bestMove on the live board), wait for the goal
const tap = async (x, y) => { const [px, py] = V(x, y); await p.mouse.move(px, py); await p.mouse.down(); await p.waitForTimeout(90); await p.mouse.up(); };
const swipe = async (a, b) => { const [ax, ay] = await p.evaluate((i) => SIM.cellXY(i), a), [bx, by] = await p.evaluate((i) => SIM.cellXY(i), b);
  const [x0, y0] = V(ax, ay), [x1, y1] = V(bx, by); await p.mouse.move(x0, y0); await p.mouse.down(); await p.mouse.move(x1, y1, { steps: 8 }); await p.waitForTimeout(60); await p.mouse.up(); };
await p.waitForTimeout(600);
await p.evaluate(() => window.__t0 = performance.now());
const comb = await p.evaluate(() => SIM.UI.bubbles.comb); await p.waitForFunction(() => SCENE.state && SCENE.state.phase === 'choice', null, { timeout: 15000 }); await p.waitForTimeout(500);   // let the story play, then pick
await p.screenshot({ path: path.join(shots, '1_choice.png') }); await tap(comb.x, comb.y); await p.waitForTimeout(1500);
await p.screenshot({ path: path.join(shots, '2_board.png') });
for (let i = 0; i < 3; i++) {                                                                      // 3 tries: first swipe, second swipe, spare
  const st = await p.evaluate(() => SCENE.state && { phase: SCENE.state.phase, got: SCENE.state.got, idle: SCENE.state.bd && SCENE.state.bd.busy === 'idle', best: SCENE.state.bd && SCENE.state.bd.best });
  if (!st || st.phase !== 'board') break;
  if (!st.idle) { await p.waitForTimeout(700); i--; if (i < -8) break; continue; }
  await swipe(st.best.a, st.best.b); await p.waitForTimeout(1200); if (i === 0) await p.screenshot({ path: path.join(shots, '3_match.png') });
}
await p.waitForTimeout(500);
const money = await p.evaluate(() => SCENE.state && SCENE.state.money);
const fps = await p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); }));
// tap the always-visible CTA
const cta = await p.evaluate(() => (SCENE.hit || []).find((b) => b.id === 'cta'));
if (cta) { const [cx, cy] = V(cta.x + cta.w / 2, cta.y + cta.h / 2); await p.mouse.click(cx, cy); }
const opened = await p.evaluate(() => (window.mraid && window.mraid.opened) || []);
await p.screenshot({ path: path.join(shots, '2_after_cta.png') });
await browser.close();
const fails = [];
if (errors.length) fails.push('page errors: ' + errors.join(' | '));
const ext = external.filter((u) => !u.endsWith('/mraid.js')); if (ext.length) fails.push('external requests: ' + ext.join(', '));
if (!(money > 0)) fails.push('no goal tiles collected after tap + swipes (money=' + money + ')');
if (!opened.length) fails.push('CTA did not call mraid.open');
if (fps < 50) fails.push('fps ' + fps);
console.log(JSON.stringify({ file: path.basename(file), view: VIEW, money, fps, cta: opened[0] || null, fails }));
process.exit(fails.length ? 1 : 0);
