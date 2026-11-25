import type { DesignStyle, FinishOption, HouseDesignSpec } from './houseDesign';

export type RoomKind = 'living' | 'dining' | 'kitchen' | 'bedroom' | 'bathroom' | 'office' | 'hall';
export type ExteriorFace = 'front' | 'back' | 'left' | 'right';

export interface Rect {
  x: number;
  z: number;
  w: number;
  d: number;
}

export interface Room extends Rect {
  id: string;
  name: string;
  kind: RoomKind;
  floor: number;
  face: ExteriorFace;
}

export interface MassVolume extends Rect {
  base: number;
  h: number;
  role: 'main' | 'upper' | 'wing' | 'bay';
}

export interface HousePlan {
  spec: HouseDesignSpec;
  finishTier: 'standard' | 'elegant' | 'luxury';
  floors: number;
  floorHeight: number;
  width: number;
  depth: number;
  height: number;
  footprintArea: number;
  flatRoof: boolean;
  roofRise: number;
  overhang: number;
  setback: number;
  glazing: number;
  volumes: MassVolume[];
  floorRooms: Room[][];
  entryX: number;
}

interface StyleProfile {
  roof: 'flat' | 'gable' | 'hip';
  overhang: number;
  setback: number;
  glazing: number;
  ridge: number;
  accent: 'wood' | 'stone' | 'metal';
}

export const STYLE_PROFILES: Record<DesignStyle, StyleProfile> = {
  Modern: { roof: 'flat', overhang: 0.65, setback: 0.16, glazing: 0.78, ridge: 0, accent: 'metal' },
  Minimalist: { roof: 'flat', overhang: 0.35, setback: 0.2, glazing: 0.5, ridge: 0, accent: 'metal' },
  Tropical: { roof: 'hip', overhang: 1.15, setback: 0.06, glazing: 0.6, ridge: 1.9, accent: 'wood' },
  Classic: { roof: 'gable', overhang: 0.55, setback: 0.04, glazing: 0.42, ridge: 1.7, accent: 'stone' },
  Scandinavian: { roof: 'gable', overhang: 0.7, setback: 0.12, glazing: 0.62, ridge: 1.1, accent: 'wood' },
  Luxury: { roof: 'flat', overhang: 0.9, setback: 0.14, glazing: 0.95, ridge: 0, accent: 'stone' },
};

export const FINISH_TIERS: Record<FinishOption, 'standard' | 'elegant' | 'luxury'> = {
  'Standard Finish': 'standard',
  'Elegant Finish': 'elegant',
  'Luxury Finish': 'luxury',
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomFrom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) | 0;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result = (result + Math.imul(result ^ (result >>> 7), 61 | result)) ^ result;
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function splitRect(rect: Rect, count: number, random: () => number): Rect[] {
  const parts: Rect[] = [{ ...rect }];
  while (parts.length < count) {
    let index = 0;
    let largest = -1;
    parts.forEach((part, current) => {
      const area = part.w * part.d;
      if (area > largest) {
        largest = area;
        index = current;
      }
    });
    const part = parts[index];
    const splitWidth = part.w >= part.d;
    const ratio = 0.42 + random() * 0.16;
    if (splitWidth) {
      const first = part.w * ratio;
      parts.splice(index, 1,
        { x: part.x - part.w / 2 + first / 2, z: part.z, w: first, d: part.d },
        { x: part.x + first / 2, z: part.z, w: part.w - first, d: part.d },
      );
    } else {
      const first = part.d * ratio;
      parts.splice(index, 1,
        { x: part.x, z: part.z - part.d / 2 + first / 2, w: part.w, d: first },
        { x: part.x, z: part.z + first / 2, w: part.w, d: part.d - first },
      );
    }
  }
  return parts;
}

function exteriorFace(room: Rect, floorRect: Rect, kind: RoomKind): ExteriorFace {
  const options: ExteriorFace[] = [];
  if (room.z + room.d / 2 >= floorRect.z + floorRect.d / 2 - 0.08) options.push('front');
  if (room.z - room.d / 2 <= floorRect.z - floorRect.d / 2 + 0.08) options.push('back');
  if (room.x + room.w / 2 >= floorRect.x + floorRect.w / 2 - 0.08) options.push('right');
  if (room.x - room.w / 2 <= floorRect.x - floorRect.w / 2 + 0.08) options.push('left');
  if (!options.length) return 'front';
  if (kind === 'living' || kind === 'office' || kind === 'dining') {
    return options.find((face) => face === 'front') ?? options[0];
  }
  return options[options.length - 1];
}

export function buildHousePlan(spec: HouseDesignSpec, seed = 1): HousePlan {
  const random = randomFrom(seed || 1);
  const floors = spec.homeType === '3-Storey' ? 3 : spec.homeType === '2-Storey' ? 2 : 1;
  const floorHeight = spec.features.includes('High ceiling') ? 3.5 : 3.05;
  const style = STYLE_PROFILES[spec.style];
  const finishTier = FINISH_TIERS[spec.finish] ?? 'standard';
  const area = clamp(Math.round(spec.floorArea), 20, 1000);
  const footprintArea = area / floors;
  const depth = clamp(Math.sqrt(footprintArea / 1.5), 5.2, 32);
  const width = clamp(footprintArea / depth, 6.2, 52);
  const height = floors * floorHeight;
  const glazing = style.glazing + (finishTier === 'luxury' ? 0.18 : finishTier === 'elegant' ? 0.09 : 0);

  const volumes: MassVolume[] = [{ x: 0, z: 0, w: width, d: depth, base: 0, h: floorHeight, role: 'main' }];

  if (floors > 1) {
    const upperWidth = width * (1 - style.setback * 2);
    const upperDepth = depth * (1 - style.setback * 1.2);
    const offsetX = style.setback > 0.1 ? width * style.setback * 0.35 : 0;
    volumes.push({
      x: offsetX,
      z: -depth * style.setback * 0.35,
      w: upperWidth,
      d: upperDepth,
      base: floorHeight,
      h: floorHeight,
      role: 'upper',
    });
  }

  if (floors > 2) {
    const thirdWidth = width * (1 - style.setback * 3.1);
    const thirdDepth = depth * (1 - style.setback * 2.2);
    volumes.push({
      x: width * style.setback * 0.15,
      z: -depth * style.setback * 0.55,
      w: thirdWidth,
      d: thirdDepth,
      base: floorHeight * 2,
      h: floorHeight,
      role: 'upper',
    });
  }

  const hasOffice = spec.features.includes('Home office');
  if (floors === 1 && (spec.bedrooms >= 4 || hasOffice)) {
    const wingWidth = width * 0.34;
    volumes.push({
      x: width / 2 + wingWidth / 2 - 0.55,
      z: -depth * 0.16,
      w: wingWidth,
      d: depth * 0.68,
      base: 0,
      h: floorHeight,
      role: 'wing',
    });
  }

  if (finishTier !== 'standard' && width > 9) {
    volumes.push({
      x: -width * 0.26,
      z: depth / 2 + 0.65,
      w: clamp(width * 0.26, 2.4, 5.6),
      d: 1.35,
      base: 0,
      h: floorHeight * 0.92,
      role: 'bay',
    });
  }

  const floorRooms: Room[][] = [];
  let bedroomNumber = 0;
  let bathNumber = 0;

  for (let floor = 0; floor < floors; floor += 1) {
    const floorVolumes = volumes.filter((volume) => Math.abs(volume.base - floor * floorHeight) < 0.01);
    const outline = floorVolumes.reduce<Rect>((union, volume, index) => {
      if (index === 0) return { x: volume.x, z: volume.z, w: volume.w, d: volume.d };
      const left = Math.min(union.x - union.w / 2, volume.x - volume.w / 2);
      const right = Math.max(union.x + union.w / 2, volume.x + volume.w / 2);
      const back = Math.min(union.z - union.d / 2, volume.z - volume.d / 2);
      const front = Math.max(union.z + volume.d / 2, volume.z + volume.d / 2);
      return { x: (left + right) / 2, z: (back + front) / 2, w: right - left, d: front - back };
    }, { x: 0, z: 0, w: 0, d: 0 });

    const remaining = spec.bedrooms - bedroomNumber;
    const bedroomsOnFloor = floors === 1
      ? remaining
      : floor === 0
        ? Math.min(remaining, spec.bedrooms >= 5 ? 2 : spec.bedrooms >= 3 ? 1 : 0)
        : floor === floors - 1
          ? remaining
          : Math.min(remaining, 2);
    const remainingBaths = spec.bathrooms - bathNumber;
    const bathroomsOnFloor = floors === 1
      ? remainingBaths
      : floor === 0
        ? Math.min(remainingBaths, spec.bathrooms >= 4 ? 2 : spec.bathrooms >= 2 ? 1 : 0)
        : floor === floors - 1
          ? remainingBaths
          : Math.min(remainingBaths, 2);
    const kinds: RoomKind[] = floor === 0
      ? ['living', 'dining', 'kitchen']
      : ['hall'];
    for (let index = 0; index < bedroomsOnFloor; index += 1) kinds.push('bedroom');
    if (floor === 0 && hasOffice) kinds.push('office');
    for (let index = 0; index < bathroomsOnFloor; index += 1) kinds.push('bathroom');

    const cells = splitRect(outline, kinds.length, random).sort((a, b) => b.w * b.d - a.w * a.d);
    const rooms = kinds.map((kind, index) => {
      const cell = cells[index];
      let name: string;
      if (kind === 'bedroom') name = `Bedroom ${++bedroomNumber}`;
      else if (kind === 'bathroom') name = `Bath ${++bathNumber}`;
      else name = kind.charAt(0).toUpperCase() + kind.slice(1);
      return {
        ...cell,
        id: `f${floor}-${kind}-${index}`,
        name,
        kind,
        floor,
        face: exteriorFace(cell, outline, kind),
      };
    });
    floorRooms.push(rooms);
  }

  while (bedroomNumber < spec.bedrooms && floorRooms.length) {
    const last = floorRooms[floorRooms.length - 1];
    const target = last.find((room) => room.kind === 'hall');
    if (!target) break;
    bedroomNumber += 1;
    target.kind = 'bedroom';
    target.name = `Bedroom ${bedroomNumber}`;
  }
  while (bathNumber < spec.bathrooms && floorRooms.length) {
    const target = floorRooms[0].find((room) => room.kind === 'hall');
    if (!target) break;
    bathNumber += 1;
    target.kind = 'bathroom';
    target.name = `Bath ${bathNumber}`;
  }

  const living = floorRooms[0]?.find((room) => room.kind === 'living');
  const entryX = living ? living.x : width * 0.18;

  return {
    spec,
    finishTier,
    floors,
    floorHeight,
    width,
    depth,
    height,
    footprintArea,
    flatRoof: style.roof === 'flat',
    roofRise: style.ridge,
    overhang: style.overhang,
    setback: style.setback,
    glazing,
    volumes,
    floorRooms,
    entryX,
  };
}
