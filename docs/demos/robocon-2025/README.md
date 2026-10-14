# ROBOCON 2025 Robot Basketball Lab

Browser-based educational simulation built for Affan Iman. The four robot mechanisms are original conceptual models, not replicas or validated designs from actual teams.

## Run
Serve `dist/` with a static HTTP server. There is no build step. `index.html` imports `app.js`, the pure rules/physics module `engine.js`, and the Three.js view `scene.js`. Three.js r170 is vendored so the game does not depend on a runtime JavaScript CDN. Fonts have local fallbacks.

## Modes
- Practice: untimed control of any robot, legal-advance and shot checks, passive opposing team.
- Match: red team controlled by the player, automatic teammate, blue AI, 120/160-second formats. AI demonstration controls all robots.
- Mechanism lab: animated cycle and exploded view of each concept.

Keyboard: WASD/arrows drive; Space shoot/dunk; E pass; F dribble; Q switch teammate; 1–4 select; P pause; C camera. Touch controls and visible action buttons are available. Drag the canvas to orbit and scroll to zoom.

## Official sources and implemented scope
- Updated rulebook: https://aburobocon2025.mnb.mn/uploads/file/ABU_ROBOCON_2025_Rulebook_20241121.pdf
- Final FAQ: https://aburobocon2025.mnb.mn/uploads/file/ABU_ROBOCON_2025_FAQ_20250805.pdf
- Court: https://aburobocon2025.mnb.mn/uploads/file/Appendix-2.pdf
- Side view: https://aburobocon2025.mnb.mn/uploads/file/Appendix-3.pdf

The simulation uses the published court size and scoring structure, legal advance and passing checks, dribble/catch-and-shoot eligibility, shot and advance clocks, backcourt checks, possession changes and rebounds. Airborne dunk credit requires positive chassis jump at release. Three-point eligibility tracks the full bumper and can downgrade while the ball is in flight. Shots already released can complete at the buzzer. Tie-breaks use fewer baskets followed by fastest successful possession; unresolved ties remain draws.

The 0.975 m rim-center endline offset is inferred from the official 0.6 m backboard offset plus standard basket geometry. The actual venue may differ within tolerances.

## Approximations
- Gravity-based sphere flight and simple rim/backboard/floor responses. No ball spin, Magnus effect, flexible net, validated materials or contact solver.
- Drive acceleration and traction, motor forces, spring energy, structural stability and sensor noise are not physically validated.
- Bumper collision constraints prevent pushing. Judge-dependent fouls, full goaltending adjudication, human reconfiguration and administrative stoppages are not reproduced. AI only attempts rising-ball deflections to avoid descending-ball goaltending.
- Referee setup and possession resets are shortened; game clocks stop during resets. Practice removes time pressure and defense.
- Aim assist can increase effective launch elevation for safe descending entry. Requested and effective angles are displayed.
- Concept masses: red 22 + 26 kg, blue 23 + 25 kg. These are design targets, not measured hardware.

## Validation
Pure-engine checks cover all four scoring mechanisms, possession reset and continued movement, guided advance, valid and too-short passes, backcourt return, assisted shots at several distances, and complete AI matches. Syntax checks cover all local modules. WebGL visual QA and WebMCP runtime validation were unavailable in the permitted preview environment; the optional WebMCP API is feature-detected and does not affect normal gameplay.

Three.js is © 2010–2024 Three.js Authors, MIT licensed. See `dist/vendor/LICENSE-three.txt`.
