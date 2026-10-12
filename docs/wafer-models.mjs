import {box} from './silicon-math.mjs';

// All in-plane geometry uses one fixed conversion: 300 mm spans 5.1 scene units.
// The choices are examples, not a process-node, yield, or cost calculator.
const MM_TO_SCENE = 5.1 / 300;
const EDGE_EXCLUSION_MM = 3;
const SCRIBE_LANE_MM = .2;
const REFERENCE_RADIUS = 2.55;
const TAU = Math.PI * 2;
const WAFER_TOP = -.035;
const DIE_TOP = -.014;
const LIFT = [0, .8, 0];

function vertex(target, point, normal, color, glow = 0) {
  target.push(...point, ...normal, ...color, glow);
}

function quad(target, a, b, c, d, normal, color, glow = 0) {
  for (const point of [a, b, c, a, c, d]) vertex(target, point, normal, color, glow);
}

function cylinder(target, radius, top, thickness, color, segments = 160) {
  const bottom = top - thickness;
  for (let i = 0; i < segments; i++) {
    const a = i / segments * TAU, b = (i + 1) / segments * TAU;
    const x1 = Math.cos(a) * radius, z1 = Math.sin(a) * radius;
    const x2 = Math.cos(b) * radius, z2 = Math.sin(b) * radius;
    vertex(target, [0, top, 0], [0, 1, 0], color);
    vertex(target, [x2, top, z2], [0, 1, 0], color);
    vertex(target, [x1, top, z1], [0, 1, 0], color);
    vertex(target, [0, bottom, 0], [0, -1, 0], color);
    vertex(target, [x1, bottom, z1], [0, -1, 0], color);
    vertex(target, [x2, bottom, z2], [0, -1, 0], color);
    const normal = [Math.cos((a + b) / 2), 0, Math.sin((a + b) / 2)];
    quad(target, [x1, bottom, z1], [x1, top, z1], [x2, top, z2], [x2, bottom, z2], normal, color);
  }
}

function annulus(target, radius, width, y, color, glow = 0, segments = 192) {
  const inner = radius - width;
  for (let i = 0; i < segments; i++) {
    const a = i / segments * TAU, b = (i + 1) / segments * TAU;
    const point = (r, angle) => [Math.cos(angle) * r, y, Math.sin(angle) * r];
    quad(target, point(inner, a), point(inner, b), point(radius, b), point(radius, a), [0, 1, 0], color, glow);
  }
}

function lane(target, x, z, width, depth) {
  const y = WAFER_TOP + .002;
  quad(target,
    [x - width / 2, y, z - depth / 2], [x - width / 2, y, z + depth / 2],
    [x + width / 2, y, z + depth / 2], [x + width / 2, y, z - depth / 2],
    [0, 1, 0], [.28, .61, .72], .12);
}

function dieColor(row, column) {
  const palette = [
    [.28, .36, .67], [.44, .28, .66], [.21, .49, .59],
    [.60, .37, .32], [.26, .39, .65], [.47, .30, .54],
  ];
  return palette[((row * 3 + column * 5) % palette.length + palette.length) % palette.length];
}

export function createWaferModel(options = {}) {
  const requested = options && typeof options === 'object' ? options : {};
  const diameter = [150, 200, 300].includes(Number(requested.diameter)) ? Number(requested.diameter) : 300;
  const dieSize = [10, 15, 20].includes(Number(requested.dieSize)) ? Number(requested.dieSize) : 10;
  const radiusMM = diameter / 2;
  const usableRadiusMM = radiusMM - EDGE_EXCLUSION_MM;
  const radius = radiusMM * MM_TO_SCENE;
  const dieWidth = dieSize * MM_TO_SCENE;
  const laneWidth = SCRIBE_LANE_MM * MM_TO_SCENE;
  const pitchMM = dieSize + SCRIBE_LANE_MM;
  const pitch = pitchMM * MM_TO_SCENE;
  const half = dieSize / 2;
  const extent = Math.floor((usableRadiusMM - half) / pitchMM);
  const sites = [];

  // Check every corner, rather than using gross area / die area. The grid is
  // deliberately centered on one die; no grid-offset optimization is claimed.
  for (let row = -extent; row <= extent; row++) {
    for (let column = -extent; column <= extent; column++) {
      const xMM = column * pitchMM, zMM = row * pitchMM;
      const corners = [[xMM - half, zMM - half], [xMM - half, zMM + half],
        [xMM + half, zMM - half], [xMM + half, zMM + half]];
      if (corners.every(([x, z]) => x * x + z * z <= usableRadiusMM * usableRadiusMM + 1e-9)) {
        sites.push({row, column, x: xMM * MM_TO_SCENE, z: zMM * MM_TO_SCENE});
      }
    }
  }

  const meshes = [];
  const add = (name, part, iridescence, build, explode = [0, 0, 0]) => {
    const data = [];
    build(data);
    if (data.length) meshes.push({name, part, iridescence, data, explode: [...explode]});
  };

  add('wafer-substrate', 'wafer', .88, data => {
    cylinder(data, radius, WAFER_TOP, .065, [.14, .22, .38]);
  });

  add('wafer-die-sites', 'die', .90, data => {
    for (const site of sites) {
      if (site.row === 0 && site.column === 0) continue;
      box(data, site.x, (WAFER_TOP + DIE_TOP) / 2, site.z,
        dieWidth, DIE_TOP - WAFER_TOP, dieWidth, dieColor(site.row, site.column), .025);
    }
  });

  add('wafer-selected-die', 'die', .72, data => {
    box(data, 0, (WAFER_TOP + DIE_TOP) / 2, 0,
      dieWidth, DIE_TOP - WAFER_TOP, dieWidth, [.66, .47, .25], .20);
    // A fine highlight lies inside the selected site's actual footprint.
    const line = Math.min(dieWidth * .035, .009);
    for (const sign of [-1, 1]) {
      box(data, 0, DIE_TOP + .003, sign * (dieWidth - line) / 2,
        dieWidth, .006, line, [.96, .75, .36], .50);
      box(data, sign * (dieWidth - line) / 2, DIE_TOP + .003, 0,
        line, .006, dieWidth, [.96, .75, .36], .50);
    }
  }, LIFT);

  add('wafer-scribe-lanes', 'scribe', .16, data => {
    // One segment per grid boundary, shared by adjacent die sites. Actual lane
    // width is kept at 0.2 mm on the same fixed in-plane scale as the wafer.
    const boundaries = new Set();
    for (const site of sites) {
      for (const sign of [-1, 1]) {
        const horizontalKey = `h:${site.column}:${2 * site.row + sign}`;
        if (!boundaries.has(horizontalKey)) {
          boundaries.add(horizontalKey);
          lane(data, site.x, site.z + sign * pitch / 2, pitch, laneWidth);
        }
        const verticalKey = `v:${2 * site.column + sign}:${site.row}`;
        if (!boundaries.has(verticalKey)) {
          boundaries.add(verticalKey);
          lane(data, site.x + sign * pitch / 2, site.z, laneWidth, pitch);
        }
      }
    }
    annulus(data, usableRadiusMM * MM_TO_SCENE, .0034, WAFER_TOP + .003,
      [.45, .50, .57], .035);
  });

  add('wafer-300mm-reference', 'reference', .04, data => {
    // The constant outer radius makes diameter changes visible at fixed scale.
    annulus(data, REFERENCE_RADIUS, .009, WAFER_TOP + .004, [.16, .35, .42], .045);
  });

  return {
    meshes,
    hotspots: [
      {id: 'wafer-silicon', label: `${diameter} mm silicon wafer`, point: [-radius * .64, WAFER_TOP, radius * .68], part: 'wafer'},
      {id: 'wafer-die', label: `${dieSize} × ${dieSize} mm example die`, point: [0, DIE_TOP + .025, 0], part: 'die', explode: [...LIFT]},
      {id: 'wafer-scribe', label: '0.2 mm scribe lane', point: [pitch / 2, WAFER_TOP + .004, 0], part: 'scribe'},
      {id: 'wafer-reference', label: '300 mm reference', point: [REFERENCE_RADIUS * .82, WAFER_TOP + .008, -REFERENCE_RADIUS * .572], part: 'reference'},
    ],
    metrics: [
      {label: 'Diameter', value: `${diameter} mm`},
      {label: 'Gross area', value: `${(Math.PI * radiusMM * radiusMM / 100).toFixed(2)} cm²`},
      {label: 'Whole die sites', value: String(sites.length)},
      {label: 'Example die', value: `${dieSize} × ${dieSize} mm`},
    ],
    note: 'Ideal centered square grid: 3 mm edge exclusion and 0.2 mm scribe lanes. Counts include only complete die sites with all four corners inside the usable circle; this is geometry, not manufacturing yield. Defects, reticle constraints, the orientation notch, and grid-offset optimization are excluded. In-plane wafer and die dimensions share a fixed scale against the 300 mm reference ring. Wafer thickness and the die lift are visually exaggerated; colours illustrate reflected thin-film colour, not measured materials.',
  };
}
