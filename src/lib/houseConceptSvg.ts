import type { HouseDesignSpec } from './houseDesign';

type Point3 = { x: number; y: number; z: number };
type ProjectedPoint = { x: number; y: number; depth: number };
type Primitive = { depth: number; svg: string };
type ConceptView = { label: string; image: string };

interface Palette {
  wall: string;
  trim: string;
  glass: string;
  roof: string;
  accent: string;
  skyTop: string;
  skyBottom: string;
  ground: string;
}

interface Face {
  id: string;
  axis: 'x' | 'y';
  fixed: number;
  uMin: number;
  uMax: number;
  outward: 1 | -1;
  tone: number;
  entrance: boolean;
}

const VIEW_ANGLES = [
  { label: 'Front', angle: 0 },
  { label: 'Front right', angle: 45 },
  { label: 'Right', angle: 90 },
  { label: 'Back right', angle: 135 },
  { label: 'Back', angle: 180 },
  { label: 'Back left', angle: 225 },
  { label: 'Left', angle: 270 },
  { label: 'Front left', angle: 315 },
] as const;

const PALETTES: Record<string, Palette> = {
  'Standard Finish': {
    wall: '#D8D0C1',
    trim: '#F3EFE7',
    glass: '#7C9DB2',
    roof: '#3F4A52',
    accent: '#C06A2C',
    skyTop: '#DCE7ED',
    skyBottom: '#F6F2EA',
    ground: '#CBCBC0',
  },
  'Elegant Finish': {
    wall: '#E1E4E3',
    trim: '#FCFCFA',
    glass: '#6F90A7',
    roof: '#30373C',
    accent: '#1B4F8C',
    skyTop: '#D9E5EB',
    skyBottom: '#F4F5F2',
    ground: '#C7CBC4',
  },
  'Luxury Finish': {
    wall: '#3B4248',
    trim: '#C7B27C',
    glass: '#5C7F96',
    roof: '#171C20',
    accent: '#C9A227',
    skyTop: '#C4D2DA',
    skyBottom: '#ECE8DE',
    ground: '#B8BDB4',
  },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function shade(hex: string, factor: number): string {
  const value = hex.replace('#', '');
  const parts = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((part) =>
    clamp(Math.round(parseInt(part, 16) * factor), 0, 255).toString(16).padStart(2, '0'),
  );
  return `#${parts.join('')}`;
}

function createProjector(angle: number) {
  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const scale = 24;
  const depthScale = 10;
  const centerX = 400;
  const baseY = 420;

  return (point: Point3): ProjectedPoint => {
    const rotatedX = point.x * cos - point.y * sin;
    const rotatedY = point.x * sin + point.y * cos;
    return {
      x: centerX + rotatedX * scale,
      y: baseY - point.z * scale + rotatedY * depthScale,
      depth: rotatedY,
    };
  };
}

function polygon(points: ProjectedPoint[], fill: string, stroke: string, width = 1, opacity = 1): string {
  const coords = points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(' ');
  return `<polygon points="${coords}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
}

function line(from: ProjectedPoint, to: ProjectedPoint, stroke: string, width = 1, opacity = 1): string {
  return `<line x1="${from.x.toFixed(1)}" y1="${from.y.toFixed(1)}" x2="${to.x.toFixed(1)}" y2="${to.y.toFixed(1)}" stroke="${stroke}" stroke-width="${width}" stroke-opacity="${opacity}" stroke-linecap="round"/>`;
}

function averageDepth(points: ProjectedPoint[]): number {
  return points.reduce((total, point) => total + point.depth, 0) / points.length;
}

function facePoint(face: Face, u: number, z: number, offset = 0): Point3 {
  const fixed = face.fixed + face.outward * offset;
  return face.axis === 'y' ? { x: u, y: fixed, z } : { x: fixed, y: u, z };
}

function renderSvg(spec: HouseDesignSpec, angle: number): string {
  const palette = PALETTES[spec.finish] ?? PALETTES['Standard Finish'];
  const floors = spec.homeType === '3-Storey' ? 3 : spec.homeType === '2-Storey' ? 2 : 1;
  const floorHeight = spec.features.includes('High ceiling') ? 3.4 : 3;
  const footprintArea = clamp(spec.floorArea / floors, 36, 260);
  const depth = clamp(Math.sqrt(footprintArea / 1.45), 5, 14);
  const width = clamp(footprintArea / depth, 6, 20);
  const height = floors * floorHeight;
  const area = Math.round(spec.floorArea);
  const flatRoof = ['Modern', 'Minimalist', 'Scandinavian', 'Luxury'].includes(spec.style);
  const edge = shade(palette.wall, 0.48);
  const project = createProjector(angle);
  const pt = (point: Point3) => project(point);
  const primitives: Primitive[] = [];
  const viewLabel = VIEW_ANGLES.find((view) => view.angle === angle)?.label ?? 'Front';

  const faces: Face[] = [
    { id: 'front', axis: 'y', fixed: depth / 2, uMin: -width / 2, uMax: width / 2, outward: 1, tone: 1.04, entrance: true },
    { id: 'right', axis: 'x', fixed: width / 2, uMin: -depth / 2, uMax: depth / 2, outward: 1, tone: 0.86, entrance: false },
    { id: 'back', axis: 'y', fixed: -depth / 2, uMin: -width / 2, uMax: width / 2, outward: -1, tone: 0.74, entrance: false },
    { id: 'left', axis: 'x', fixed: -width / 2, uMin: -depth / 2, uMax: depth / 2, outward: -1, tone: 0.8, entrance: false },
  ];

  for (const face of faces) {
    const wallPoints = [
      pt(facePoint(face, face.uMin, 0)),
      pt(facePoint(face, face.uMax, 0)),
      pt(facePoint(face, face.uMax, height)),
      pt(facePoint(face, face.uMin, height)),
    ];
    const wallDepth = averageDepth(wallPoints);
    primitives.push({ depth: wallDepth, svg: polygon(wallPoints, shade(palette.wall, face.tone), edge, 1.3) });

    for (let floor = 1; floor < floors; floor += 1) {
      const z = floor * floorHeight;
      primitives.push({
        depth: wallDepth + 0.002,
        svg: line(pt(facePoint(face, face.uMin, z, 0.02)), pt(facePoint(face, face.uMax, z, 0.02)), shade(palette.wall, 0.55), 1, 0.65),
      });
    }

    const span = face.uMax - face.uMin;
    const columns = span > 9 ? 3 : 2;
    for (let floor = 0; floor < floors; floor += 1) {
      const bottom = floor * floorHeight + 0.8;
      const windowHeight = spec.features.includes('High ceiling') ? 1.8 : 1.35;
      const top = Math.min((floor + 1) * floorHeight - 0.3, bottom + windowHeight);

      for (let column = 0; column < columns; column += 1) {
        const center = face.uMin + ((column + 0.5) * span) / columns;
        const isDoor = face.entrance && floor === 0 && column === Math.floor(columns / 2);
        const halfWidth = isDoor ? 0.68 : Math.min(0.85, (span / columns) * 0.3);
        const low = isDoor ? 0 : bottom;
        const high = isDoor ? Math.min(2.15, floorHeight - 0.35) : top;
        const detailDepth = wallDepth + 0.01 + column * 0.0002 + floor * 0.0001;
        const outer = [
          pt(facePoint(face, center - halfWidth - 0.08, low - (isDoor ? 0 : 0.08), 0.04)),
          pt(facePoint(face, center + halfWidth + 0.08, low - (isDoor ? 0 : 0.08), 0.04)),
          pt(facePoint(face, center + halfWidth + 0.08, high + 0.08, 0.04)),
          pt(facePoint(face, center - halfWidth - 0.08, high + 0.08, 0.04)),
        ];
        const inner = [
          pt(facePoint(face, center - halfWidth, low, 0.05)),
          pt(facePoint(face, center + halfWidth, low, 0.05)),
          pt(facePoint(face, center + halfWidth, high, 0.05)),
          pt(facePoint(face, center - halfWidth, high, 0.05)),
        ];
        primitives.push({ depth: detailDepth, svg: polygon(outer, palette.trim, edge, 0.8) });
        primitives.push({
          depth: detailDepth + 0.0001,
          svg: polygon(inner, isDoor ? shade(palette.roof, 1.1) : palette.glass, shade(palette.trim, 0.8), 0.7, isDoor ? 1 : 0.92),
        });
        if (!isDoor) {
          primitives.push({
            depth: detailDepth + 0.0002,
            svg: line(
              pt(facePoint(face, center, low, 0.06)),
              pt(facePoint(face, center, high, 0.06)),
              shade(palette.trim, 0.85),
              0.8,
              0.9,
            ),
          });
        } else {
          primitives.push({
            depth: detailDepth + 0.0002,
            svg: line(
              pt(facePoint(face, center + halfWidth - 0.18, low + 1, 0.07)),
              pt(facePoint(face, center + halfWidth - 0.18, low + 1.22, 0.07)),
              palette.accent,
              2,
            ),
          });
        }
      }
    }
  }

  if (spec.features.includes('Balcony') && floors > 1) {
    const z = floorHeight;
    const x0 = -width * 0.28;
    const x1 = width * 0.28;
    const y0 = depth / 2;
    const y1 = depth / 2 + 0.85;
    const slab = [pt({ x: x0, y: y0, z }), pt({ x: x1, y: y0, z }), pt({ x: x1, y: y1, z }), pt({ x: x0, y: y1, z })];
    primitives.push({ depth: 90, svg: polygon(slab, palette.trim, edge, 1) });
    for (let index = 0; index <= 7; index += 1) {
      const x = x0 + ((x1 - x0) * index) / 7;
      primitives.push({
        depth: 90.01,
        svg: line(pt({ x, y: y1, z }), pt({ x, y: y1, z: z + 0.95 }), shade(palette.trim, 0.72), 1.1),
      });
    }
    primitives.push({
      depth: 90.02,
      svg: line(pt({ x: x0, y: y1, z: z + 0.95 }), pt({ x: x1, y: y1, z: z + 0.95 }), shade(palette.trim, 0.72), 1.4),
    });
  }

  if (spec.features.includes('Carport')) {
    const x0 = width / 2 - Math.min(4, width * 0.38);
    const x1 = width / 2 + 0.45;
    const y0 = depth / 2;
    const y1 = depth / 2 + 2.6;
    const roofZ = 2.7;
    const canopy = [
      pt({ x: x0, y: y0, z: roofZ }),
      pt({ x: x1, y: y0, z: roofZ }),
      pt({ x: x1, y: y1, z: roofZ - 0.18 }),
      pt({ x: x0, y: y1, z: roofZ - 0.18 }),
    ];
    primitives.push({ depth: 91, svg: polygon(canopy, shade(palette.roof, 0.92), edge, 1) });
    for (const x of [x0 + 0.22, x1 - 0.22]) {
      primitives.push({
        depth: 91.01,
        svg: line(pt({ x, y: y1 - 0.25, z: 0 }), pt({ x, y: y1 - 0.25, z: roofZ - 0.18 }), shade(palette.trim, 0.7), 2.4),
      });
    }
  }

  if (flatRoof) {
    const slab = [
      pt({ x: -width / 2 - 0.15, y: -depth / 2 - 0.15, z: height }),
      pt({ x: width / 2 + 0.15, y: -depth / 2 - 0.15, z: height }),
      pt({ x: width / 2 + 0.15, y: depth / 2 + 0.15, z: height }),
      pt({ x: -width / 2 - 0.15, y: depth / 2 + 0.15, z: height }),
    ];
    primitives.push({ depth: 100, svg: polygon(slab, shade(palette.roof, 0.86), edge, 1.2) });
    const parapet = height + 0.34;
    const corners = [
      { x: -width / 2 - 0.15, y: -depth / 2 - 0.15 },
      { x: width / 2 + 0.15, y: -depth / 2 - 0.15 },
      { x: width / 2 + 0.15, y: depth / 2 + 0.15 },
      { x: -width / 2 - 0.15, y: depth / 2 + 0.15 },
    ];
    for (let index = 0; index < corners.length; index += 1) {
      const current = corners[index];
      const next = corners[(index + 1) % corners.length];
      primitives.push({
        depth: 100.01,
        svg: polygon(
          [pt({ ...current, z: height }), pt({ ...next, z: height }), pt({ ...next, z: parapet }), pt({ ...current, z: parapet })],
          shade(palette.roof, index % 2 === 0 ? 0.98 : 0.8),
          edge,
          0.8,
        ),
      });
    }
  } else {
    const ridgeZ = height + 1.6;
    const slopes = [
      {
        points: [
          { x: -width / 2, y: depth / 2, z: height },
          { x: width / 2, y: depth / 2, z: height },
          { x: width / 2, y: 0, z: ridgeZ },
          { x: -width / 2, y: 0, z: ridgeZ },
        ],
        tone: 1,
      },
      {
        points: [
          { x: -width / 2, y: -depth / 2, z: height },
          { x: width / 2, y: -depth / 2, z: height },
          { x: width / 2, y: 0, z: ridgeZ },
          { x: -width / 2, y: 0, z: ridgeZ },
        ],
        tone: 0.78,
      },
    ];
    slopes.forEach((slope, index) => {
      primitives.push({
        depth: 100 + index,
        svg: polygon(slope.points.map(pt), shade(palette.roof, slope.tone), edge, 1.2),
      });
    });
    primitives.push({
      depth: 100.5,
      svg: line(pt({ x: -width / 2, y: 0, z: ridgeZ }), pt({ x: width / 2, y: 0, z: ridgeZ }), shade(palette.roof, 1.25), 1.6),
    });
  }

  if (spec.features.includes('Solar-ready')) {
    const panelY = flatRoof ? 0 : depth * 0.22;
    const panelZ = flatRoof ? height + 0.08 : height + 0.9;
    const panel = [
      pt({ x: -width * 0.3, y: panelY - 0.9, z: panelZ }),
      pt({ x: -width * 0.05, y: panelY - 0.9, z: panelZ }),
      pt({ x: -width * 0.05, y: panelY + 0.9, z: panelZ }),
      pt({ x: -width * 0.3, y: panelY + 0.9, z: panelZ }),
    ];
    primitives.push({ depth: 101, svg: polygon(panel, '#1C2E3B', shade(palette.trim, 0.6), 0.8, 0.94) });
    for (let index = 1; index < 4; index += 1) {
      const x = -width * 0.3 + ((width * 0.25) * index) / 4;
      primitives.push({
        depth: 101.01,
        svg: line(pt({ x, y: panelY - 0.9, z: panelZ }), pt({ x, y: panelY + 0.9, z: panelZ }), shade(palette.trim, 0.5), 0.6, 0.7),
      });
    }
  }

  const footprint = [
    pt({ x: -width / 2, y: -depth / 2, z: 0 }),
    pt({ x: width / 2, y: -depth / 2, z: 0 }),
    pt({ x: width / 2, y: depth / 2, z: 0 }),
    pt({ x: -width / 2, y: depth / 2, z: 0 }),
  ];
  const shadow = polygon(footprint, '#000000', '#000000', 0, 0.1);
  const ordered = primitives.sort((a, b) => a.depth - b.depth).map((item) => item.svg).join('\n  ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img" aria-label="${viewLabel} architectural concept">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.skyTop}"/><stop offset="1" stop-color="${palette.skyBottom}"/></linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.ground}"/><stop offset="1" stop-color="${shade(palette.ground, 0.88)}"/></linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0 H0 V32" fill="none" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="1"/></pattern>
  </defs>
  <rect width="800" height="600" fill="url(#sky)"/>
  <rect y="420" width="800" height="180" fill="url(#ground)"/>
  <rect y="420" width="800" height="180" fill="url(#grid)"/>
  ${shadow}
  ${ordered}
  <rect x="24" y="24" width="352" height="58" rx="4" fill="#192227" opacity="0.9"/>
  <text x="40" y="47" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="13" letter-spacing="2.2">AG ARCHITECTURAL CONCEPT</text>
  <text x="40" y="66" fill="#B9C7CE" font-family="Arial, Helvetica, sans-serif" font-size="11" letter-spacing="1.1">${viewLabel.toUpperCase()} ELEVATION · ${area} SQM · ${spec.style.toUpperCase()}</text>
  <rect x="560" y="24" width="216" height="40" rx="4" fill="#FFFFFF" opacity="0.78"/>
  <text x="576" y="49" fill="#3A464D" font-family="Arial, Helvetica, sans-serif" font-size="11" letter-spacing="0.8">${width.toFixed(1)}m × ${depth.toFixed(1)}m · ${floors} FLOOR${floors > 1 ? 'S' : ''}</text>
</svg>`;
}

export function buildHouseConceptSvg(spec: HouseDesignSpec, angle = 0): string {
  return renderSvg(spec, angle);
}

export function buildHouseConceptViews(spec: HouseDesignSpec): ConceptView[] {
  return VIEW_ANGLES.map((view) => ({
    label: view.label,
    image: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderSvg(spec, view.angle))}`,
  }));
}
