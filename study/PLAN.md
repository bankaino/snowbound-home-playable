# SNOWBOUND HOME — playable ad plan (state file: keep it current, tick boxes as you go)

Skill: `ref2playable` (`<S>` = ~/.claude/skills/ref2playable, `<R>` = ~/.claude/skills/ref2game/scripts).
Read `<S>/SKILL.md` + `<S>/references/ad-rules.md` once per session. Nothing else from ref2game unless stuck.
Always: `export PYTHONUTF8=1 PLAYWRIGHT=<R>/node_modules/playwright`. Project root = this folder (azuregames/new).
Reference: study/ref/1_kicked_out → 2_shelter → 3_choice → 4_match3 (a "rescue story + match-3" ad of a real game —
NEVER reproduce its name, logo, heroine design or UI art; same genre, beats and camera only). User replies in Russian.

## Decisions (user, 2026-10-09)
- Flow: story intro (kicked out into snow → shelter with baby) → choice of 3 bubbles → match-3 → transformation → endcard.
- ANY bubble leads to the game: same board, only the goal tile + the payoff change. The hand points at the COMB.
- Own brand "SNOWBOUND HOME" (logo = text drawn in code). Own heroine "Mia": auburn hair in one braid, mustard knitted
  sweater, jeans, barefoot; baby in a pale-blue blanket. (Ref heroine is blonde/purple — do not copy.)
- Finale: room transforms (wow) → the other 2 bubbles pulse with a lock "SHE NEEDS MORE" → endcard. One board only.
- HTML5 via ref2playable, single file, all networks. Own git repo in this folder; publish only after asking the user.

## Game (portrait 1080×H, fixed camera, no world scroll). `S.phase`: 'intro' | 'choice' | 'board' | 'reveal'
INTRO (plays before input, any tap skips to CHOICE; caption on a dark ribbon at top):
  0.0–1.2 s shot A "outside": bg_outside (snowy porch, house wall, warm lit doorway), door sprite slams shut (scaleX
    1→0.15 pivot hinge, then 0.15→1 with overshoot + camera shake + thud), warm light wedge (code) shrinks to 0,
    hero_snow slides in from the doorway onto the snow, blizzard particles + wind. Caption "KICKED OUT IN THE COLD!".
  1.2 s white whip-flash cut → shot B "shelter": bg_room (ruined cold room, broken window, snow drifts, NO armchair),
    hero_sad (sitting in a torn armchair hugging the baby — armchair is PART of the hero sprites) shivers (±3 px x jitter,
    breath puffs every 1.1 s), snow falls through the window. Caption "...SHE FOUND A SHELTER".
CHOICE (from ~2.2 s): 3 bubbles pop in one by one (scale 0→1.15→1, 0.12 s apart) like 3_choice: WINDOW top-centre,
  COMB right, DRESS left; white bubble + tail toward Mia + soft yellow glow + bob (code), icon inside (tile art).
  Hand taps the COMB (loop), line "HELP MIA! PICK ONE". Tap a bubble → pulse + sparkle burst + "pop" sound; the other two
  shrink away; the chosen icon flies to the goal panel at the top; board flies in from below (squash on land).
  No input 4 s in CHOICE → auto-pick COMB (passive viewers must see the real game). The BOARD never plays itself.
BOARD (like 4_match3, room dimmed + blurred-ish via dark overlay behind it):
  Grid 5 cols × 6 rows, cell 170 px, navy rounded frame with light-blue rim (code), centred, top at ~0.30 H.
  Tiles (4 kinds): leaf (green), coin (gold star), yarn (red ball of wool), GOAL (comb | window | dress — the choice).
  Goal panel top (cream plank, brown rim, goal icon + "0/6", code-drawn). Goal K.GOAL = 6.
  Input: press on a cell + drag ≥ K.SWIPE_PX (60) in the dominant axis → swap with that neighbour (press edge =
  `inp.press && !S.prevPress`). Also tap cell, tap neighbour. Invalid swap → swap and back (K.SWAP_T each) + head-shake
  of both tiles + "thunk". Valid → clear (tiles scale up 1.2 then pop, sparkles in tile colour), gravity fall with
  bounce, refill from above, cascades (chime pitch rises per cascade, callouts "SWEET!" / "GREAT!" / "AMAZING!").
  Match of 4+ in a line → line blast clears the whole row/column (glowing beam in code, shake) — the board's wow.
  Goal tiles cleared fly to the goal panel (reuse coins-fly-to-HUD), counter pops; S.money = goal items collected.
  The START board is fixed in sim.js (see phase 1 note): the hinted first swap clears ≥4 goal tiles (line blast),
  the 2nd finishes. Refill = seeded RNG with K.GOAL_BIAS
  (0.30) toward goal tiles; if no move exists → reshuffle (deterministic). `bestMove(S)` (most goal tiles, then most
  tiles) drives: the idle hand (idle > 2.5 s → ghost-swipe of bestMove), scriptInput (demo) and the smoke test.
REVEAL (~2.8 s) — EACH CHOICE CHANGES ONLY ITS OWN THING (user decision 2026-10-09, after Gate A):
  COMB  → only her HAIR becomes neat (hero_comb = edit of hero_sad, hair only). Face still sad, sweater, snow, window: unchanged.
  DRESS → only her CLOTHES become the pink dress (hero_dress, clothes only). Hair stays messy, window stays broken.
  WINDOW → only the WINDOW is repaired (window_patch over bg_room): draft + snow through the window stop, she stops shivering,
           a little warmth in the grade. Her hair/clothes stay as they were.
  Common: board drops out, magic swirl of stars closes on the changed spot, bloom flash, push-in 1.07, local glow where the change
  happened (NO global warm grade), cross-fade 0.6 s, caption by choice ("LOOKING NEAT AGAIN!" / "A WARM NEW DRESS!" / "NO MORE
  DRAFT!"), then the two other wishes return LOCKED (padlock) with "SHE NEEDS MORE..." — they are the unfixed things.
ENDCARD: headline by endWhy — win "ONE WISH GRANTED!" + "Help Mia fix everything!", time/idle "MIA STILL NEEDS YOU!"; mascot = the
  hero of the chosen wish (hero_comb / hero_dress / hero_sad for the window); stat "6/6 ✓"; whole screen = CTA "PLAY FREE";
  small replay. No hard fail anywhere; END_MAX 28 s → endWhy 'time'.
HUD (lay out from H, never 1920): logo text top-left small; goal panel top-centre (BOARD only); persistent CTA bar
  bottom (≈110 px) the whole time incl. INTRO; tutorial hand + line from the template.

## Beats (seconds from page start; demoCheck must hit them via scriptInput)
| t | beat |
|---|---|
| 0–1.2 | outside: door slam + hero in the snow (world moves before input) |
| 1.2–2.2 | shelter cut, shivering |
| ~2.2–3 | bubbles + hand on COMB (hook ≤ 3 s) · demo taps COMB at ~3.5 |
| 4–4.5 | board in; demo swipe at ~5 → line blast + cascade, goal ≥ 4/6 by 7 s (first reward ≤ 8 s) |
| ~8–10 | 2nd move → 6/6 → 'win' |
| 10–13 | REVEAL (wow) → endcard ≤ 14 s. Passive viewer: auto-pick at ~6.2, endcard at 12 s ('idle') |
K: SWAP_T 0.14, CLEAR_T 0.18, FALL_G 5200 px/s², GOAL 6, GOAL_BIAS 0.30, SWIPE_PX 60, AUTO_PICK 4, HAND_IDLE 2.5,
   REVEAL_T 2.8, END_NO_INPUT 12, END_IDLE 10, END_MAX 28. Events in S.ev: intro_cut, bubbles, choose, swap, bad, match,
   blast, cascade, goal, win, reveal, end. demoCheck: choose ≤ 4.5, first goal ≤ 8, win ≤ 11, end ≤ 15, no 'bad' in demo.

## Template: KEEP (generic) vs REPLACE (game)
KEEP: engine (gl/lib/batch), ad mode in live/index.html, audio.js structure, scene HUD blocks (money pill logic →
  reused as goal fly-to-panel, callouts pop(), tutorial hand + line, persistent CTA bar, endcard, S.hit, S.QA()),
  build_playable.py, variants mechanism, verify.sh contract (create/step/at/spawn/demoCheck, S.ev, S.end/endWhy,
  S.firstIn/lastIn, S.money, VIEW).
REPLACE: sim.js entirely as the game above (phases, grid as flat array of {k, y, vy, st}, swap/clear/fall/refill as
  timed states so the scene only interpolates; export `UI` = bubble + board + cta rects from VIEW, `cellXY(c,r)`,
  `bestMove(S)` so scene, smoke test and demo share them). scene.js world: bg cover-fit (centred on the armchair, crop
  sides), hero sprite stack + jitter, bubbles, board frame + tiles via BATCH, particles via BATCH, colour grade tint.
  Remove joystick ring, guide arrow, edge marker, level badges, money pill (keep code paths only if reused).
  tools/smoke_test.mjs: wait 0.6 s → tap the COMB bubble (SIM.UI) → wait 1.2 s → swipe bestMove twice (via cellXY,
  1 s apart) → check `S.money > 0` (goal tiles collected) → tap CTA. audio.js: wind loop (filtered noise), door thud,
  bubble pop, swap whoosh, match chime (pitch by cascade), thunk, goal ding, line-blast zap, magic swirl, giggle
  arpeggio, win fanfare. tools/build.json: title "Snowbound Home", textures below, store links (placeholders ok).
  Delete template textures/prompts not used (tree_*, harvester*, rival*, trailer*, stump, log, ground_tex).
  After editing build.json, re-run `python <S>/scripts/new.py . --title "Snowbound Home"` — it only adds labelled
  placeholders for the new texture names (never overwrites).

## Assets (name → max px, alpha|lossy) — painted casual mobile-game look (soft cel shading, clean outlines, glossy
## icons), light from the window (upper-left), cold blue-grey room vs warm skin/hair accents. Codex, ≤ 3 jobs at once.
bg_room 1024 lossy (portrait 1024×1536 job size; ruined wooden room, broken window upper-left with icicles, snow drifts,
  torn wallpaper, cobweb, wall clock; EMPTY floor centre-low where the armchair goes; no people) ·
bg_outside 1024 lossy (portrait; snowy porch, house wall with a lit arched doorway right, blizzard, no people, no door) ·
door 420 alpha (wooden door with window panes, flat front view, rectangle — hinge on its left edge) ·
hero_sad 720 alpha (Mia in a torn armchair, hugging the baby, messy hair, sad, front 3/4) →
  hero_happy, hero_dress = EDITS of the approved hero_sad (`"ref": ["art/gen/hero_sad.png=edit target: ..."]`, change
  ONLY hair+face / ONLY clothes; same pose, chair, framing, size) ·
hero_snow 620 alpha (Mia lying in snow on her side clutching the baby, looking back, same design — ref hero_sad) ·
tiles_sheet → slice to tile_leaf, tile_coin, tile_yarn, tile_comb, tile_window, tile_dress 160 alpha (glossy round-ish
  icons, same size, centred, wide gutters; `<R>/slice.py art/gen/tiles_sheet.png ... --order x`) ·
window_patch 460 alpha (the broken window boarded with planks + warm curtain, matching bg_room's window — make it an
  edit of a crop of bg_room; store its x,y,w in live/sizes.js) · hand 272 (template prompt).
Code-drawn: bubbles, glow, padlock, board frame, goal panel, ribbon captions, light wedge, snow, sparkles, beams, tint.

## Phases (one Sonnet session each; tick and note results here)
- [x] 0. Questions answered; project created on placeholders (`new.py . --title "Snowbound Home"`), refs copied to
      study/ref (temp paths die with the session), template `verify.sh` = VERIFY OK (template game still in place).
- [x] 1. DONE 2026-10-09 (Sonnet 5.5). Nested git repo (author set per repo), commits "scaffold" + "sim: story + match-3".
      sim.js rewritten: phases intro→choice→board→reveal→end, 5×6 grid as timed states (swap/back/clear/fall/refill),
      swipe + tap-select input, bestMove(), reshuffle, auto-pick after 4 s, END_* rules, scriptInput demo, demoCheck.
      DEVIATIONS from the text above (this is now the truth):
      · START board is NOT the hand-authored one: it was found by a seeded search (/tmp script, 60k boards) so that the
        hinted swap clears ≥4 goal tiles and the 2nd swap wins: `['YGYCL','LLGYC','LYYGL','CYLCG','CGGYG','LCGGL']`.
        Demo timeline (real): choose 3.5 · swap 4.9 · 4/6 at 5.06 (line blast) · swap 2 at 6.3 · win 6.64 · reveal 7.0 ·
        endcard 9.8 s · passive viewer: auto-pick 6.2, endcard 12.0 s. L = 20 s loop. (Shorter than the 13 s above; fine.)
      · Refill avoids free 3-runs (pass 2 in removeAndFall) so cascades come from the board, not luck.
      · live/scene.js is a PHASE-1 PLACEHOLDER (flat shapes + coloured placeholder tiles, all phases drawn, hit areas, QA
        states, CTA bar, endcard). Phase 2 rewrites the world drawing; keep S.hit / S.QA / caption+CTA+endcard blocks.
      · art/gen holds coloured placeholders (bg_* gradients, round tiles, boxes for heroes) for ALL textures in build.json;
        gen_batch.py moves them to art/placeholder before generating. Template textures/prompts removed (examples stay).
      · smoke_test.mjs now: wait 2.8 s → tap COMB → swipe SIM best move up to 3× → check S.money > 0 → tap CTA.
      · audio.js: engine drone disabled (S.p gone); sounds still the template's — phase 2 replaces them.
      · sim API for scene/tests: SIM.UI {grid, board, goal, bubbles, ORDER, cellXY, cellAt}, SIM.bestMove(kinds),
        S.bd {cells[{k,fy,vy,ox,oy,clr}], busy, idleSince, best}, S.sel, events: intro_cut bubbles choose swap bad match
        blast cascade goal win reveal end shuffle. Cell kind 3 = goal tile (texture by S.choice).
      verify.sh: VERIFY OK (qa 9 states, 0.13 MB per network, 61 fps, smoke goal 7/6). Headless checks done: skip intro by tap,
      bad swap + restore, tap-select swap, idle → endcard at 13 s, JSON round-trip of state.
- [x] 2. DONE 2026-10-09 (Sonnet 5.5). scene.js rewritten (still placeholder sprites), audio.js rewritten. verify.sh OK
      (qa 13 states incl. window/dress reveals, 0.13 MB, 61 fps). Contact sheet of 8 beats checked once (frames/g, ignored).
      Done: intro A (door slam via matrix scaleX + camera shake, warm light that dies with the door, hero_snow slides in, blizzard
      streaks), whip flash cut, shelter B (shiver, breath puffs, snow through the window, cold grade), bubbles with tails + pop-in
      + hand on comb, chosen bubble flies to the goal panel with sparkles, board frame + checker cells, tile-coloured sparkles per
      cleared tile (match event carries idx/kk), line-blast beam + shake, landing squash, goal-tile breathing, goal fly with arc +
      trail + panel pop, counter counts landed tiles, new tiles fade in at the frame top (no scissor), callouts SWEET!/GREAT!/
      AMAZING!, reveal (swirl of stars, warm grade + glow, cross-fade sad→happy|dress or window_patch, locked bubbles + "SHE NEEDS
      MORE..."), endcard (headline by endWhy, hero, sparkles, stat, whole-screen CTA, replay).
      sim got events `slam` (t=0.7) and match.idx/kk. audio.js: wind loop (dies on reveal), slam thud, whip, 3 pops, choose, swap
      whoosh, bad thunk, pentatonic match chime by cascade, goal ding on landing, blast zap, cascade, shuffle, win, reveal swirl +
      giggle, end. Not listened to on a real device.
      [ART] tuning for phase 3 (constants at the top of scene.js / sizes.js): HERO centre/bottom, WIN (window position = SIZES.patchAt),
      breath puff position (bot - 640), door left x/bottom, hero_snow slide path, Z.* display sizes, bubble positions in SIM.UI.
- [x] 3. DONE 2026-10-09 (Sonnet 5.5). Art via Codex (ChatGPT plan, no Claude tokens), 3 batches: bg_room, bg_outside, door,
      hero_sad, hand, tiles_a/b_sheet (sliced into 6 tiles) → hero_happy / hero_dress (edits of hero_sad), hero_snow (design ref),
      window_patch (edit of art/ref/window_crop.png, feathered in PIL) → hand regenerated after the critic. verify OK, 0.91 MB per
      network (textures 16 MB → 608 KB webp), 61 fps. Style bible = art/style_bible.txt; ref.png = 2_shelter (style ref).
      Geometry now comes from the art: SIZES.doorBox (arch opening in bg_outside), winAt + patchRect (window in bg_room), all as
      image fractions → scene `imgPt()` (cover-fit aware, works on every phone aspect). hero_snow sized by width (900).
      Gate A critic (study/critique/gateA.md): overall 5.5; art "at the reference's level", prototype feel = code-drawn polish.
      FIXED from it: hero visible from t=0 (hook), endcard ghost removed (world hero hidden, warm overlay, app icon, stat pill),
      hero fades under the board + contact shadows (chair, hero_snow), bubble tails aim at Mia + golden rim + shadow, layered
      beam + callout above the goal panel + 2× sparks, board light-blue rim + goal panel brown rim, reveal = push-in 1.07 + bloom
      flash + window light + rising hearts, locked bubbles bigger, captions in reveal at y=190, door width 1.0×, hand regenerated
      (painted, no cuff; tip offset 0.218 × width), hero_snow base feathered.
      NOT done (candidates for phase 4, in this order): (a) bg_room_warm.png = edit of bg_room (window boarded, curtain, rug,
      lamp, no drifts) cross-faded for ALL choices — the real "transformation" wow; (b) hero_happy/hero_dress repaint the chair
      (alpha IoU 0.97) → shimmer during the 0.6 s cross-fade; fix by compositing only head/clothes onto hero_sad in prep, or regen
      with "chair pixel-identical"; (c) embed an OFL display font (Lilita One) — needs a download, ask the user; (d) real store
      URLs in tools/build.json (placeholders now); (e) 60 ms hit-stop on blast (needs a sim freeze).
- [ ] 4. FEEL (Gate B): play it on the live page (serve.sh, `?ad=1`), tune K headless; check a manual player who makes
      a bad first move still wins by ~15 s; passive endcard ≤ 12 s; fps ≥ 60 at 390×844. `verify.sh all` green →
      critic Gate B → max 2 fix rounds. Commit.
- [ ] 5. VARIANTS + delivery: rewrite variants/*.json for THIS game (template ones are Timber Rush keys):
      `short_goal` (GOAL 4 — shorter loop), `no_story` (skip INTRO, start in CHOICE — is the story worth 2 s?),
      `no_choice` (comb only, bubbles skipped — does the choice add engagement?), `cta_copy` ("SAVE MIA" vs "PLAY FREE").
      `python tools/build_playable.py --variant all`; README.md case study (refs described, not shipped; hypotheses;
      sizes; fps; critic scores; known gaps). Commit.
- [ ] 6. PUBLISH — ASK THE USER FIRST: public repo `bankaino/snowbound-home-playable` + Pages from /docs
      (`python tools/build_playable.py --variant all --pages docs`). Never push study/ref or reference frames.

## Phase 3b (2026-10-09, user feedback: "every choice gives its own result")
- Replaced hero_happy (changed hair+face+baby+snow) by hero_comb (hair only); hero_dress regenerated (clothes only); both are edits of
  hero_sad with "everything else identical" (chair/pose match: no more shimmer). All room heroes share one draw scale (same canvas).
- Removed the global warm grade; window choice stops snow/shiver/breath/wind sound; others keep them. Reveal audio: giggle → ta-da.
- window_patch feather rebuilt from art/raw (alpha 0 within 60 px of the edge, full at 170 px) — a bright frame line used to show.
- Variants idea for phase 5: `fix_all` (all three wishes in sequence: three short boards) vs one wish — only if the 30 s budget allows.

## Risks / notes
- Hero edits must keep pose + framing or the cross-fade jumps: compare hero_sad vs edit at 50 % opacity on one sheet;
  if off, crop/scale-align in prep (store offsets in sizes.js), don't re-roll blindly.
- Tall phones: bg is 1024×1536 (1.5) but view up to 2.17 → cover-fit crops sides; keep the window + armchair inside the
  central 70 % width (say so in the bg prompt).
- Board must stay readable: tiles ≥ 150 px on 1080, 3 kinds + goal clearly different in hue AND silhouette.
- Story beat costs time: keep INTRO ≤ 2.2 s and skippable; the A/B `no_story` variant measures it.
