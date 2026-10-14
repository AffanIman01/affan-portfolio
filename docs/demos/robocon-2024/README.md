# Harvest Lab — Robocon 2024

An independent, interactive single-team learning simulator of ABU Robocon 2024 Harvest Day, created for Affan Iman. Competition identity, theme, and rules belong to their respective organizers. This is not an official ABU product.

## Experience
- Three-dimensional approximate arena, orbit/top/follow cameras, keyboard and touch controls.
- R1 manual waypoints and assisted rack collection, planting, alternating harvest, ballistic transfer.
- Independent autonomous R2, using initial storage inventory immediately, rejecting purple grains, carrying one red paddy and filling silos.
- Six-seedling guided strategy, 12-seedling option, free practice, and a 180-second solo trial.
- Explorable concept mechanisms, gripper/lift cycles, exploded view, adjustable drive speed, launch angle and speed, and an aim-assist solution.

## Model and scope
Three.js renders the field and mechanisms. `app/engine.ts` owns deterministic game state and time stepping. Drive speed is in model metres per second; field dimensions are illustrative, not competition CAD. Acceleration is first-order smoothing, with slower motion under ball load. Mechanisms are kinematic. Robot bodies have simplified exclusion radii and zone clamps; there is no rigid-body contact, torque, slip, traction, sensor-noise or structural model. The controller knows ball colors and coordinates. Launches use constant gravity (9.81 m/s²), no air drag, and a rectangular storage landing test. Aim assist solves launch speed for a chosen elevation and target height.

Blue is a static field reference, not an opponent. This is a solo practice experience, not a complete referee model. No penalties, retries, opponent strategy, tie-breaks or robot hardware certification are simulated. Each silo holds three balls. Three full own-color silos achieve the solo Mùa Vàng objective.

## Controls
WASD/arrows move R1; click the red half for a waypoint; Enter requests the next task; Space pauses or resumes; 1/2 selects a robot. Drag orbits and scroll zooms. Touch direction buttons are available. A task with a mechanism action finishes before manual override. R2 has no manual driving control.

## References
- Organizer-hosted ABU rulebook: https://www.tpa.or.th/robot/files/2024/ABU-Robocon-2024-Rulebook.pdf
- Organizer handbook with ABU rules and appendix: https://dit-mawa.upi.edu/wp-content/uploads/2024/01/Buku-Pedoman-KRI-2024-fix.pdf
- FAQ 4.1 mirror consulted for three-ball silo capacity: https://www.scribd.com/document/708462051/FAQ4-1-16-02

## Validation
`node --experimental-strip-types scripts/check-simulation.mjs`

Deterministic trials check the complete six-seedling autonomous route at 0.6, 1.6 and 2.4 model m/s, final 390-point scoring, harvest credits, forbidden waypoints, pause, R1 limits and match timeout. TypeScript is checked with `node node_modules/typescript/bin/tsc --noEmit`.

No supported cloud-browser testing context was available in the build session. WebMCP registration is feature-detected and shares the UI's engine actions; supported-browser execution was not verified. It is optional and does not affect gameplay.

## GitHub Pages static build
Run `npm ci` and `npm run build`. Serve `dist/` over HTTP. This browser build preserves the original simulator and requires WebGL; no sign-in or backend is needed.
