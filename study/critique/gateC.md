# Gate C - Snowbound Home, whole-game verdict. Measured: verify.sh = VERIFY OK (1.58 MB, 61 fps, qa 20 states); SIM players (30 seeds each)
## 1. Scores (1-10)
hook 6 | story pacing 6 | clarity 8 | feel/juice 7 | economy 7 | payoff-per-wish 6 (window 8, dress 8, comb 4) | idle/frost 7 | HUD/CTA/endcard 7 | visual polish 8 | tech readiness 7 | OVERALL 7
## 2. Verdict: LAUNCH AFTER FIXES (soft-launch test, not scale spend)
- Art, story logic, one-finger clarity and the "each wish changes only its own thing + locked wishes" CTA hook are above the reference's level and safe to test.
- Timeline of a patient player (waits the story out): first input 4.2 s, first goal 7.7 s, win 12.3 s, endcard 16 s. Inside the rules (first reward <=8 s, wow <=15 s, end <=30 s), but only just on the first.
- Weakest link is the payoff: comb (the default hand target) changes only hair, and at phone size reveal_b vs the sad frame is barely different; all 3 reveals keep a sad face.
- Economy is "easy, no tension": valid-move players win 30/30 in ~3 moves; blind swipers win only 7/30 with 11.3 bad swaps and end at 26.3 s median (27.2 max).
- Not device-tested, store URLs are placeholders, audio never heard: fine for an internal test, blocking for a paid network test.
## 3. Strengths to keep / better than the reference / worse
KEEP: hero in frame 0 + "GET OUT!"; painted continuity (same chair/pose in every variant); 5x6 board with goal panel; hit-stop + beam; reveal local-only change; locked bubbles tappable; frost idle mechanic (cosy-sad, not horror); persistent PLAY FREE bar; endcard whole-screen CTA; 1.58 MB.
BETTER than ref (4 frames only): richer painted look and lighting; idle viewers get a designed ending, ref has none; three different payoffs + locked upsell; faint-smile close; full A/B kit; ad-network builds + automated QA.
WORSE than ref: first interaction 4.2 s vs ref's choice screen after two short shots; no tap affordance during the story (nobody knows a tap skips); ref's heroine changes expression (visible emotional wow), ours stays sad by design = understated payoff; ref board is smaller (4x5) and simpler to read; our endcard hero is only ~1/3 of the screen with dead space under it.
## 4. Is the 4.2 s story a good trade? Conditionally yes
- The first 3 s are not empty: heroine + door slam + "GET OUT!" + caption are on screen at t=0.3 (hook in frames/g). It is a story hook, not an interaction hook; the rule "<=3 s" is about showing the verb, and here the verb (match-3) appears at 5.5 s in the demo.
- Cost: a tap-skipper finishes the whole ad in 8.7 s (end median), a non-skipper in 16 s; the 12 s of extra length buys the emotional setup the locked-wishes CTA relies on. Gap between "ad starts" and "player acts" is the churn risk, and nothing invites the tap.
- Change: show a pulsing hand/"TAP" micro-hint at 2.0 s on the story, make the three bubbles appear at 3.0 s on top of the shelter shot (story 3.0 s, not 4.2). Keep 4.2 s only if no_story shows <5% completion gain.
## 5. Top 5 remaining fixes (impact order)
1. WHAT comb payoff + default K.PICK='comb'. WHY comb payoff 4/10 (Gate B), still weakest in reveal_b/reveal_smile frames, and the hand + default point at it. CHANGE: default PICK 'dress'; give the comb a visible win (hair colour/shine shift or sparkle trail on the braid, 1.15x hero push), so the three payoffs are equally readable.
2. WHAT story length/affordance. WHY first input 4.2 s, first goal 7.7 s for a patient player; tap-skip is undiscoverable. CHANGE: bubbles at 3.0 s, tap hint, INTRO_END 3.4; test with no_story first.
3. WHAT blind-swiper cohort. WHY 7/30 win, 11.3 bad swaps, end 26.3 s (4 s from the 30 s limit; END_MAX 22 counts from the first input, after the story). CHANGE: after 3 bad swaps highlight a valid pair, after 5 auto-play it; END_MAX 22 -> 18 so the worst endcard is <=24 s.
4. WHAT reveal/endcard transition + endcard layout. WHY qa report: reveal_a ui 4 (lowest of 20): goal panel and board edge peek behind the CTA bar while sliding out; endcard hero is small and leaves a big empty lower third. CHANGE: finish the board slide-out before the bar, hero 680 -> 820 px, CTA at 0.70 H.
5. WHAT ship blockers. WHY placeholder store URLs (com.example.snowboundhome), no device/SDK test, audio unheard, tools/player_policies.js crashes at the story phase (p.bd null, stale since 4.2 s intro; my patched copy ran), stale frames/qa/reveal.png (orange "hero_happy" placeholder) is not produced by qa any more. CHANGE: real URL, test on 2 phones, fix tool (first 4.3, null guard), delete stale frame before publishing.
## 6. Idle viewer note
Fully passive: chill 10.2 s, frozen endcard 16.6 s; tap-skip then idle: 13.4 s; picks a wish then idles: 18.2 s; none ever see a payoff (0 goals). Nice and safe, but the CTA there is "warm her up", not a reward: judge it in the test with the auto_pick variant as control.
## 7. A/B order
1 default vs no_story (story value, the biggest open question). 2 pick_dress vs default (payoff quality/CTR). 3 cta_copy (cheapest, near-zero risk). 4 long_goal (retention vs completion). 5 frost_fast (only if idle share is high in the first data). 6 auto_pick (idle cohort control). Last: sad_end, pick_window (run only if dress wins and a second target is needed).
