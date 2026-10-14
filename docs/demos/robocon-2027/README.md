# Mustika Lab — ROBOCON 2027 practice simulator

A browser-based solo practice arena and original two-robot concept study created for Affan Iman. The deliverable is a static Three.js application; all JavaScript needed for the simulation is bundled locally. Fonts use Google Fonts with system fallbacks.

## Play

Start practice to drive the red Transporter Robot with WASD/arrow keys; Q/E rotates, G picks up, F releases on the elevated transfer pad. On touch devices the in-arena controls appear during manual practice. The Builder Robot operates autonomously. Watch demo resets and runs both robots. Use the robot lab to inspect the two proposed mechanisms.

Two pre-run strategies target 420 or 490 points. Simulation clock speed can be set to 1×, 2× or 4×. Switching to the lab/guide or hiding the tab pauses play.

## Provenance

The official theme and rule basis belong to the ABU Robocon 2027 organizers:
- https://aburobocon2027.id/theme/
- https://aburobocon2027.id/rulebook/
- https://aburobocon2027.id/download/728/?tmstv=1787554332

The PDF linked by the organizer identifies V1.0; checked 1 October 2026. No claim that this is the latest technical revision elsewhere. Rules, event and branding are not authored by Affan Iman. Original robot concept names and mechanism models are proposals for this simulator and are not existing competition hardware. No confidential work is used.

## Scope and limits

Deterministic kinematic training, with idealized routes and assisted pickup/release. Exact arena offsets are approximated from the official diagrams. Principal platform and object dimensions are in metres. Ground, L1 and L2 surfaces, stairs, ramp, supply objects and the two robot concepts are interactive geometry.

Not a contact-dynamics or competition compliance simulator. No adversary, Sky stealing, collisions between moving bodies, friction, toppling, payload-induced motion changes, actuator power model, sensor noise, or referee decisions. The TR manual boundary guard represents a simplified base footprint rather than the entire extended envelope. Pickup/release is spatially assisted and object placement snaps to targets. Time estimates cannot establish real robot cycle performance.

BR follows a state machine reacting to released objects and transfer-pad occupancy. The internal world model represents perfect perception, not permitted inter-robot radio communication. The builder moves one object at a time. Deployment motion is representative, not a checked CAD assembly. The arm motion does not solve inverse kinematics.

The rulebook contains conflicting retry wording. This practice version returns TR's carried objects to supply on Retry. A full Reset restores the entire practice.

## Robot concepts

GARUDA TR: 4WD rubber-wheel platform, retractable lift/fork, padded side clamp, low three-object magazine, object sensing and ball cradle.

CANDI BR: compact rubber tracks with articulated flippers, telescoping lift, compliant gripper/wrist and ball cradle; onboard vision, ToF, encoders and IMU proposed for independent autonomous operation. Flippers and forks fold in the initial rendered pose. Mass and packaging values shown are design targets, not measurements.

Detailed CAD, stability and traction calculations, actuator sizing, wiring, hardware tests and current-rule verification remain before fabrication.

## Source structure

- `dist/index.html` / `style.css`: responsive workspace, touch controls, guide and concept details.
- `dist/sim.js`: deterministic model, robot state machines, assisted handling, mission scoring and constraints.
- `dist/scene.js`: Three.js field and mechanical visualization.
- `dist/app.js`: input, state presentation and feature-detected WebMCP registration.
- `test-sim.mjs`: full-match and invariant verification.

No build step is required. Use any standard static file server for local use. ES modules require HTTP rather than opening the HTML with a file URL.

## Verification

`node --check dist/app.js`, `node --check dist/scene.js`, `node --check dist/sim.js`, and `node test-sim.mjs`.

Test coverage: both 180-second routes, totals, continuing play after Mustika placement, capacity limits, latched mandate gating, transfer on elevated pad, no duplicate transfer score, pause, reset and TR base-zone checks. A permitted live browser/WebMCP verification context was unavailable; browser visual QA and native WebMCP execution are not claimed.

Three.js r170 and OrbitControls: Copyright Three.js Authors, MIT; see `dist/THREE-LICENSE.txt`.
