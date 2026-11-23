import { DEFAULT_DISCLAIMER } from './constants';
import { DESIGN_PACKAGE, FINISH_PACKAGES } from './companyInfo';
import { buildHouseConceptViews } from './houseConceptSvg';

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

export function buildDesignPrompt(spec: HouseDesignSpec, estimate: HouseDesignEstimate): string {
  const finish = FINISH_PACKAGES.find((p) => p.shortName === spec.finish) ?? FINISH_PACKAGES[0];
  const area = Math.min(1000, Math.max(20, Math.round(spec.floorArea)));
  const features = spec.features.length ? spec.features.join(', ') : 'no extra features specified';
  return [
    `Create a realistic architectural rendering of a ${spec.homeType.toLowerCase()} house in the Philippines.`,
    `Total floor area: ${area} sqm. ${spec.bedrooms} bedrooms, ${spec.bathrooms} bathrooms.`,
    `Architecture style: ${spec.style}. Finish package: ${estimate.packageName} — ${finish.inclusions.slice(0, 4).join(', ')}.`,
    `Include: ${features}.`,
    'Show a three-quarter exterior view in daylight with a clean tropical landscape, natural materials, and a welcoming entrance.',
    'No people, no text, no logos, no watermarks. High-detail architectural visualization.',
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
