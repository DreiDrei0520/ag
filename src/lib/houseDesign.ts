import { DEFAULT_DISCLAIMER } from './constants';
import { FINISH_PACKAGES, DESIGN_PACKAGE } from './companyInfo';
import { buildHouseConceptViews } from './houseConceptSvg';
import { buildHousePlan } from './houseLayout';

export const HOME_TYPES = ['Bungalow', '2-Storey', '3-Storey'] as const;
export const DESIGN_STYLES = ['Modern', 'Minimalist', 'Tropical', 'Classic', 'Scandinavian', 'Luxury'] as const;
export const DESIGN_FEATURES = ['Balcony', 'Carport', 'High ceiling', 'Landscaping', 'Home office', 'Solar-ready'] as const;

export type HomeType = (typeof HOME_TYPES)[number];
export type DesignStyle = (typeof DESIGN_STYLES)[number];
export type DesignFeature = (typeof DESIGN_FEATURES)[number];
export type FinishOption = (typeof FINISH_PACKAGES)[number]['shortName'];

export interface HouseDesignSpec {
  homeType: HomeType;
  floorArea: number;
  bedrooms: number;
  bathrooms: number;
  finish: FinishOption;
  style: DesignStyle;
  features: DesignFeature[];
  includeDesignPackage: boolean;
}

export interface HouseDesignEstimate {
  packageName: string;
  ratePerSqm: number;
  construction: number;
  design: number;
  total: number;
  disclaimer: string;
}

export interface GeneratedDesignImage {
  image: string;
  mimeType: string;
  source: 'gemini' | 'concept';
  views?: { label: string; image: string }[];
  note?: string;
}

export const FINISH_OPTIONS = FINISH_PACKAGES.map((p) => p.shortName);

export const formatPeso = (value: number) => `₱${value.toLocaleString('en-PH')}`;

export function createHouseDesignSpec(): HouseDesignSpec {
  return {
    homeType: 'Bungalow',
    floorArea: 100,
    bedrooms: 3,
    bathrooms: 2,
    finish: FINISH_PACKAGES[0].shortName,
    style: 'Modern',
    features: ['Carport'],
    includeDesignPackage: false,
  };
}

export function estimateHouseDesign(spec: HouseDesignSpec): HouseDesignEstimate {
  const finish = FINISH_PACKAGES.find((p) => p.shortName === spec.finish) ?? FINISH_PACKAGES[0];
  const area = Math.min(1000, Math.max(20, Math.round(spec.floorArea)));
  const construction = area * finish.pricePerSqm;
  const design = spec.includeDesignPackage ? DESIGN_PACKAGE.price : 0;
  return {
    packageName: finish.name,
    ratePerSqm: finish.pricePerSqm,
    construction,
    design,
    total: construction + design,
    disclaimer: DEFAULT_DISCLAIMER,
  };
}

const STYLE_DESIGN_NOTES: Record<(typeof DESIGN_STYLES)[number], string> = {
  Modern: 'flat roof with slim parapet, clean horizontal massing, ribbon windows, cantilevered shades, smooth rendered walls',
  Minimalist: 'pure cubic volumes, flat roof, restrained palette, sparse precisely framed windows, uncluttered facade',
  Tropical: 'steep hipped roof with wide overhangs, timber louvers and screens, deep shaded veranda, lush planting',
  Classic: 'symmetrical facade, gabled roof, columns and cornices, traditional proportioned windows, stone accents',
  Scandinavian: 'low-pitch gable, pale wood cladding, light walls, tall narrow windows, simple honest detailing',
  Luxury: 'layered flat roof, full-height glazing, stone and dark timber facade, dramatic entry portal, warm architectural lighting',
};

const FINISH_DESIGN_NOTES: Record<(typeof FINISH_OPTIONS)[number], string> = {
  'Standard Finish': 'clean painted neutral walls, simple aluminum windows and standard doors, restrained exterior details, basic lawn and shrubs',
  'Elegant Finish': 'premium timber slat accents, large glass windows, refined layered facade, decorative exterior sconces, detailed landscaping',
  'Luxury Finish': 'premium stone cladding and dark wood, sophisticated facade composition, floor-to-ceiling glass where appropriate, advanced exterior lighting, luxury landscaping with water feature and outdoor living space',
};

const FEATURE_DESIGN_NOTES: Record<(typeof DESIGN_FEATURES)[number], string> = {
  Balcony: 'a real upper-floor balcony with slab and railing, physically attached to the building',
  Carport: 'a covered carport with columns, sloped canopy and paved driveway',
  'High ceiling': 'taller floor-to-ceiling proportions and transom glazing',
  Landscaping: 'layered trees, shrubs, garden beds and a planted approach',
  'Home office': 'a dedicated private office room with its own exterior window',
  'Solar-ready': 'a roof-mounted solar panel array with visible framing',
};

export function buildDesignPrompt(spec: HouseDesignSpec, estimate: HouseDesignEstimate): string {
  const finish = FINISH_PACKAGES.find((p) => p.shortName === spec.finish) ?? FINISH_PACKAGES[0];
  const area = Math.min(1000, Math.max(20, Math.round(spec.floorArea)));
  const plan = buildHousePlan(spec);
  const roomSchedule = plan.floorRooms
    .map((rooms, floor) => `level ${floor + 1}: ${rooms.map((room) => room.name).join(', ')}`)
    .join('; ');
  const features = spec.features.length
    ? spec.features.map((feature) => FEATURE_DESIGN_NOTES[feature]).join('; ')
    : 'no extra features specified';
  return [
    'Professional architectural visualization for a real construction company portfolio, photorealistic exterior render.',
    `Project: ${spec.homeType.toLowerCase()} house in the Philippines, ${spec.style} architecture, ${estimate.packageName}.`,
    `Geometry: ${plan.floors} floor${plan.floors > 1 ? 's' : ''}, approximately ${plan.width.toFixed(1)}m wide by ${plan.depth.toFixed(1)}m deep on a ${area} sqm total floor area, ${plan.flatRoof ? 'flat roof' : 'pitched roof'}, ${plan.spec.features.includes('High ceiling') ? 'high ceiling' : 'standard ceiling height'}.`,
    `Room program reflected in massing and window placement: ${roomSchedule}. Exactly ${spec.bedrooms} bedrooms and ${spec.bathrooms} bathrooms.`,
    `Architectural style requirements: ${STYLE_DESIGN_NOTES[spec.style]}.`,
    `Finish package requirements: ${FINISH_DESIGN_NOTES[spec.finish]}. Included materials: ${finish.inclusions.slice(0, 5).join(', ')}.`,
    `Physically incorporate: ${features}.`,
    'Rendering: physically based materials with realistic wall texture, roof tiles or membrane, reflective glass, natural sunlight and soft shadows, ambient occlusion, global illumination, detailed tropical trees and grass, professional three-quarter eye-level camera composition.',
    'No people, no text, no logos, no watermarks.',
  ].join('\n');
}

export function specFromPrompt(prompt: string): HouseDesignSpec {
  const spec = createHouseDesignSpec();
  const value = prompt.toLowerCase();
  const area = prompt.match(/(\d+)\s*sqm/i);
  const bedrooms = prompt.match(/(\d+)\s*bedrooms?/i);
  const bathrooms = prompt.match(/(\d+)\s*bathrooms?/i);
  if (area) spec.floorArea = Number(area[1]);
  if (bedrooms) spec.bedrooms = Number(bedrooms[1]);
  if (bathrooms) spec.bathrooms = Number(bathrooms[1]);
  const homeType = HOME_TYPES.find((type) => value.includes(type.toLowerCase()));
  const finish = FINISH_OPTIONS.find((option) => value.includes(option.toLowerCase()));
  const style = DESIGN_STYLES.find((item) => value.includes(item.toLowerCase()));
  if (homeType) spec.homeType = homeType;
  if (finish) spec.finish = finish;
  if (style) spec.style = style;
  spec.features = DESIGN_FEATURES.filter((feature) => value.includes(feature.toLowerCase()));
  return spec;
}

export function isHouseDesignPrompt(text: string): boolean {
  const value = text.toLowerCase();
  const designIntent = /(create|generate|render|design|draw)/.test(value);
  return value.includes('architectural rendering') || (designIntent && value.includes('floor area') && value.includes('sqm'));
}

export const designImageFileName = (image: string) =>
  image.startsWith('data:image/svg+xml') ? 'ag-house-design.svg' : 'ag-house-design.png';

function localConceptFallback(prompt: string): GeneratedDesignImage {
  const views = buildHouseConceptViews(specFromPrompt(prompt));
  return {
    image: views[0].image,
    mimeType: 'image/svg+xml',
    source: 'concept',
    views,
    note: 'Live AI rendering is unavailable, so this is an AG architectural concept generated from your specs — drag to view all sides.',
  };
}

export async function generateHouseDesignImage(prompt: string): Promise<GeneratedDesignImage> {
  try {
    const res = await fetch('/api/design-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: prompt.trim().slice(0, 3000) }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      image?: string;
      mimeType?: string;
      source?: 'gemini' | 'concept';
      views?: { label: string; image: string }[];
      note?: string;
      error?: string;
    };
    if (!res.ok || !data.image) return localConceptFallback(prompt);
    return {
      image: data.image,
      mimeType: data.mimeType || 'image/png',
      source: data.source || 'gemini',
      views: data.views,
      note: data.note,
    };
  } catch {
    return localConceptFallback(prompt);
  }
}
