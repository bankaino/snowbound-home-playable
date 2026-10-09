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
- [x] 4. DONE 2026-10-09 (Sonnet 5.5). verify.sh OK (qa 16 states, 1.24 MB per network, 61 fps), critic Gate B (study/critique/gateB.md,
      overall 7/10; hook 7, clarity 8, juice 7, economy 7, payoff-per-choice 6 — comb weakest, window/dress 8).
      MEASURED (tools/player_policies.js, tools/perf_probe.mjs): valid-move and bad-first-move players win in 8.5 s median / 12 p90 / 15.6 max
      (30/30); slow player (3 s per move) wins at 16 s; tap-bubble-then-idle → endcard 13.2 s; passive viewer → endcard 14.0 s; blind
      swipers (82 % of pairs invalid) win 6/30, endcard ≤ 28.7 s. Perf: board tiles instanced via BATCH (all 30 = 1 draw): draws board idle
      122 → 53, clear+fall 173 → 104; at 4× CPU throttle clear+fall 53.6 → 58.2 fps; no console errors.
      DONE from Gate B: AUTO_PICK 4 → 2.5, END_NO_INPUT 12 → 14, END_MAX 28 → 22, REVEAL_T 2.8 → 3.4; BY follows the aspect (0.27–0.33 H);
      window bubble y ≥ 460 (no caption overlap on 16:9); hand appears after 2 bad swaps (S.badStreak); 60 ms hit-stop on line blasts
      (S.freeze); comb reveal = stronger push-in (1.12) + brush-stroke sweep + hair sparkles; bubble tails bigger; hand wrist faded;
      locked wishes are tappable (→ store); endcard: warm light overlay 0.30, hero 680 px, layout scales with H (Y()), window patch stays
      visible; FAINT SMILE (user idea): hero_*_smile (3 edits, expression only) cross-fades in at reveal t 2.0–2.6 s and stays on the
      endcard (K.SMILE=1); goal panel text leaves before the panel slides out (no overlap with the CTA bar).
      NOT done on purpose: K.ASSIST auto-solve for passive viewers (the board must not play itself — decision of the plan; ask the user);
      font embed (needs a download → ask); real store URLs (placeholders com.example.snowboundhome / id0000000000 → ask).
      New K switches for A/B: K.PICK ('comb'|'dress'|'window' = hand + auto-pick target), K.SMILE (0|1), K.GOAL (6|9), K.BAD_HINT.
- [x] 5. DONE 2026-10-09 (Sonnet 5.5). variants/: default, long_goal (GOAL 9), pick_dress, pick_window (K.PICK), sad_end (K.SMILE 0),
      no_story (K.STORY 0: opens on the bubbles; demo now taps PICK DEMO_PICK_AFTER s after the choice phase starts), cta_copy
      ("copy": {"cta": "SAVE MIA"}, read at render time by scene.ctaTxt() because the build applies overrides after the modules).
      Old Timber Rush variants deleted. `verify.sh all` = VERIFY OK for all 7 (1.24 MB each, google 0.89, meta under 2 MB, 61 fps).
      README.md = the case study (flow, workflow, measured numbers, variants, build/test commands, repo map, honest gaps).
      Headless demo per variant: GOAL 9 win 13.4/end 17.2 s; STORY 0 win 4.5/end 8.2 s; PICK dress win 6.7/end 10.4 s.
## Phase 5b (2026-10-09, user feedback: idle viewers + font)
- User decisions: do NOT publish yet (play it locally first); store links stay placeholders; font download allowed → Lilita One (OFL) inlined
  as live/font.js (TTF base64, font-weight range so 'bold' uses the real glyphs), index.html awaits FONT_READY, licenses/OFL-LilitaOne.txt.
- Idle viewers (user idea): NO auto-solve, NO auto-pick (K.AUTO_PICK 0). After K.FROST_AT=6 s without input Mia freezes: S.frost rises over
  K.FROST_T=6 s (thaws at 1.5/s on touch), scene = hero_frozen cross-fade + frost_frame edges + stronger shiver + wind + captions
  ("SHE IS FREEZING! TAP!" / "HURRY! SHE IS FREEZING!"), events chill/freeze, then endWhy 'frozen' (headline "MIA IS FREEZING!", hero_frozen).
  Passive viewer: chill 8.2 s, endcard 14.6 s. Variants auto_pick (old behaviour) and frost_fast (4 s / 5 s) added. 9 variants total.
- Assets: hero_frozen (edit of hero_sad: frost only), frost_frame (transparent frost border, 640 px). Build 1.63 MB (Meta 2 MB limit ok).

## Phase 5c (2026-10-09, user playtest feedback)
- Intro shot A: the heroine no longer "flies" (a still image sliding looked fake). She lies in the snow from the very first frame; the door slams
  over her (shake, light dies), she recoils a few px with a puff of snow, and a comic "GET OUT!" shout pops beside the doorway (0.12–1.5 s).
- Freeze effect softened: no accelerating shake (constant shiver), no blue skin/grimace — hero_frozen regenerated as hero_sad + frost rime on
  the hair tips, small icicles on the braid and chair, a cloud of breath; blue grade 0.22 → 0.07; wind boost 2.5 → 1.0. Frost frame at the
  screen edges stays. Principle: pressure must not scare — cold, cosy-sad, never horror.

## Phase 5d (2026-10-09, user: "the first screen ends too fast")
- Intro retimed: K.SLAM_AT 1.3 (door closes 1.05–1.3; "GET OUT!" pops at 0.35, fades 2.0–2.4), K.INTRO_CUT 2.8, K.INTRO_END 4.2 (was 1.2 / 2.2): the
  story now takes 4.2 s (shot A 2.8 s, shelter 1.4 s); any tap still skips it. Demo: choose 5.5, win 8.6, reveal 9.0, end 12.4. Passive viewer:
  chill 10.2, frozen endcard 16.6 s (END_NO_INPUT 18 so frost ends first). smoke/perf tools wait for phase 'choice' instead of fixed sleeps.
  Trade-off: first interaction now at 4.2 s (ad rules say hook ≤ 3 s) — the `no_story` variant measures exactly this.

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
