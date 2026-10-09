# Snowbound Home — a playable ad (HTML5, single file)

A 15–25 second portrait playable ad for a home-restoration puzzle game: a young mother is thrown out into a blizzard, finds a ruined shelter,
picks **one of three wishes** (a comb, a dress, a window) and plays a short match-3 to grant it. **Each wish changes only its own thing**
— the comb fixes only her hair, the dress only her clothes, the window only the window — and the two unchosen wishes come back locked
("SHE NEEDS MORE…"), which is the hook for the install tap.

Everything here is original art and code. The idea (story hook → wish choice → match-3 → payoff → endcard) comes from studying a real
mobile-game ad; the reference frames, its characters, logo and name are **not** in this repository.

* One HTML file per ad network, **1.24 MB** (Google: 0.89 MB zip). All textures are inlined as WebP; no external requests except the network's own tag.
* Networks built from one project: AppLovin, Unity Ads, ironSource, Mintegral, Google Ads, Meta (2 MB limit) + a preview build.
* 60 fps on a 390×844 phone viewport; 58 fps with the CPU throttled 4×.
* Seven A/B variants from small JSON files (`variants/`), each with a written hypothesis.

## Flow (what the player sees)

| t (demo) | beat |
|---|---|
| 0–1.2 s | The door slams (shake, the warm light dies), Mia is thrown out into the snow — the heroine is on screen from the first frame |
| 1.2–2.2 s | Whip cut to the shelter: she shivers, her breath fogs, snow blows through the broken window |
| 2.2–3.5 s | Three wishes pop in; a hand points at the comb; one tap |
| 3.5–6.6 s | 5×6 match-3, goal 6 tiles of the chosen wish. First swap is a line blast (4–5 goal tiles), the second finishes |
| 7–10.4 s | Reveal: swirl, flash, push-in, light only where the change happened; she lets out a faint, relieved smile; the other two wishes return locked and are tappable (→ store) |
| 10.4 s → | Endcard: whole screen is the CTA, replay is small; the store button is visible during the whole ad |

Safety nets: a viewer who does nothing sees the comb auto-picked at 4.7 s and the endcard at 14 s; a player who loses (never reaches the goal)
still gets an endcard ("MIA STILL NEEDS YOU!") by ≤ 28 s; two bad swaps in a row bring the hint hand back.

## How it was made (the workflow is the point of this repo)

1. **Reference → plan.** Four ad frames were read for beats, camera and economy; `study/PLAN.md` holds the plan, the decisions and what changed afterwards (the plan is the project's memory, written phase by phase).
2. **Engine + sim.** A tiny WebGL2 engine (instanced batching, post FX) and a **deterministic 120 Hz simulation** (`live/sim.js`): every reaction is a timed state or an event, the scene only draws. The attract demo is a planner that plays the ad with the same input path as a player; `demoCheck()` asserts its beats.
3. **Art with AI, not by hand.** Backgrounds, the heroine, tiles, door and hand were generated with Codex (image generation) from a measured style bible (`art/style_bible.txt`) and one prompt file per asset (`art/prompts/`). The three heroine variants and the window patch are **edits of one approved sprite** with "change only X", so poses and the armchair match to the pixel and the cross-fade does not shimmer. Soft edges, feathering and slicing are scripted.
4. **Automated checks instead of eyeballing.** One command runs: syntax, demo beats, passive-viewer endcard, HUD overflow/overlap on 16 staged screens (`qa`), the build for every network, and a phone smoke test (taps the comb, swipes the best moves, taps the CTA, checks the console, external requests, fps).
5. **Independent critics.** Two Sonnet critic passes (`study/critique/gateA.md`, `gateB.md`) scored the build against the reference and the ad rules; their top fixes were applied and measured.
6. **Players as tests.** `tools/player_policies.js` simulates human-like players (best-move, valid-random, wasted first move, slow thinker, blind swiper, idle) and prints win time / endcard time; `tools/perf_probe.mjs` measures draw calls and frame times per phase under CPU throttling.

## Measured

| | |
|---|---|
| Build | 1.24 MB per network (textures 20.6 MB of PNG → 848 KB WebP at the drawn size, code 94 KB) |
| Draw calls (board) | 122 → 53 idle, 173 → 104 clearing, after instancing the 30 tiles into one draw |
| Frame rate | 60 fps at 390×844; 58 fps with the CPU throttled 4× during the heaviest phase (was 53.6) |
| Time to first reward | 4.8 s (median valid player), 6.6 s after a wasted first move |
| Time to win / endcard | 8.5 s median, 12 s p90, 15.6 s worst of 30 / endcard ≈ 12–19 s |
| Idle viewer | endcard at 14 s; blind swiper: endcard ≤ 28.7 s |
| Critic scores | Gate A 5.5/10 (before the polish pass) → Gate B 7/10 |

## A/B variants (`variants/*.json` → `dist/<variant>/<network>.html`)

| variant | hypothesis |
|---|---|
| `default` | Baseline: story intro, three wishes, goal 6, hand + auto-pick on the comb, faint smile at the end, "PLAY FREE" |
| `long_goal` | Goal 9 (≈ 5.7 moves, win ~14 s, endcard ~17 s): more invested play before the endcard lifts install intent |
| `pick_dress` | Hand and auto-pick point at the dress (strongest contrast) instead of the comb (weakest at phone size) |
| `pick_window` | Hand and auto-pick point at the window (clearest payoff); compare with `pick_dress` |
| `sad_end` | No faint smile after the fix: does unfinished need or relief drive the install tap? |
| `no_story` | Skip the 2.2 s story, open on the three wishes: is the story worth its 2 s? |
| `cta_copy` | "SAVE MIA" instead of "PLAY FREE" |

A variant is `{ "hypothesis": "...", "K": { overrides of SIM.K }, "copy": { ... } }` — a new hypothesis is a new 5-line file and `python tools/build_playable.py --variant all`.

## Build and test

```bash
python tools/build_playable.py --variant all      # dist/<variant>/applovin.html, unity.html, ironsource.html, mintegral.html, google.zip, meta.html, preview.html
node tools/smoke_test.mjs dist/default/applovin.html
node tools/player_policies.js                     # simulated players
node tools/perf_probe.mjs 4                       # draw calls / fps per phase, CPU throttle 4×
```

Needs Python 3 with Pillow, and Node with Playwright for the tests. Art generation is **not** needed to build (generated PNGs are in `art/gen`).
The live preview page is `live/index.html?ad=1` served from the project root.

## Repository map

```
live/        engine (gl.js, lib.js, batch.js), sim.js (game + demo), scene.js (drawing + HUD), audio.js (procedural sound), assets, sizes.js
art/         style_bible.txt, prompts/ (one per asset), gen/ (generated PNGs), jobs*.json (generation batches), ref/ (edit crops)
tools/       build_playable.py (all networks), build.json (textures, store links), smoke_test.mjs, player_policies.js, perf_probe.mjs
variants/    A/B hypotheses
study/       PLAN.md (decisions + phase log), critique/ (critic reports)
```

## Known gaps (honest list)

* Store links in `tools/build.json` are placeholders (`com.example.snowboundhome`); no real store listing exists for this prototype.
* Not tested on a physical device or inside a real ad-network SDK container — only a headless phone viewport with a stub MRAID container.
* Sound is procedural (WebAudio) and was not listened to on a device; a licensed/recorded soundtrack would be next.
* UI font is a system stack (Arial Black → Roboto on Android); embedding one open-licence display font is the next polish step.
* Passive viewers get a real, unplayed board (by design the board never plays itself); an "assist" mode that makes the first move is a testable variant.
* The faint smile and the heroine's face stay sad in the reveal on purpose (the "only its own thing" rule); an emotional close-up on the endcard is in `default`, off in `sad_end`.
* Hand-made game-feel is code, not authored animation: Mia is one pose per variant cross-faded, not a rig.
