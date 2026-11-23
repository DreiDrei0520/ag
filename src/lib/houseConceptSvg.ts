import type { HouseDesignSpec } from './houseDesign';

interface Palette {
  wall: string;
  wallLight: string;
  trim: string;
  roof: string;
  glass: string;
  accent: string;
  skyTop: string;
  skyBottom: string;
  ground: string;
}

const PALETTES: Record<string, Palette> = {
  'Standard Finish': {
    wall: '#E9DCC8',
    wallLight: '#F6EFE2',
    trim: '#FFF9EF',
    roof: '#46535C',
    glass: '#8FB9CF',
    accent: '#F26B21',
    skyTop: '#CFE4F2',
    skyBottom: '#F7F1E6',
    ground: '#C6D5B6',
  },
  'Elegant Finish': {
    wall: '#E4E9EC',
    wallLight: '#F7FAFB',
    trim: '#FFFFFF',
    roof: '#2C3238',
    glass: '#7FA8C4',
    accent: '#1B4F8C',
    skyTop: '#D7E7F2',
    skyBottom: '#F3F6F7',
    ground: '#B8CBAE',
  },
  'Luxury Finish': {
    wall: '#3B4248',
    wallLight: '#535C64',
    trim: '#D8C07A',
    roof: '#171B1F',
    glass: '#6C93AB',
    accent: '#C9A227',
    skyTop: '#B8CBD9',
    skyBottom: '#E8E4D9',
    ground: '#A8BCA0',
  },
};

export function buildHouseConceptSvg(spec: HouseDesignSpec): string {
  const palette = PALETTES[spec.finish] ?? PALETTES['Standard Finish'];
  const floors = spec.homeType === '3-Storey' ? 3 : spec.homeType === '2-Storey' ? 2 : 1;
  const flatRoof = ['Modern', 'Minimalist', 'Scandinavian', 'Luxury'].includes(spec.style);
  const area = Math.min(1000, Math.max(20, Math.round(spec.floorArea)));
  const baseY = 470;
  const floorHeight = floors === 3 ? 80 : 95;
  const left = 190;
  const width = 420;
  const houseHeight = floors * floorHeight;
  const topY = baseY - houseHeight;
  const tallWindows = spec.features.includes('High ceiling');
  const windowHeight = tallWindows ? 58 : 46;

  const windows = Array.from({ length: floors }, (_, row) => {
    const y = topY + 20 + row * floorHeight;
    const columns = row === floors - 1 ? [0, 2] : [0, 1, 2];
    return columns
      .map((column) => {
        const x = left + 42 + column * 122;
        return `<rect x="${x}" y="${y}" width="64" height="${windowHeight}" rx="3" fill="${palette.glass}" stroke="${palette.trim}" stroke-width="3"/><line x1="${x + 32}" y1="${y}" x2="${x + 32}" y2="${y + windowHeight}" stroke="${palette.trim}" stroke-width="2"/>`;
      })
      .join('');
  }).join('');

  const roof = flatRoof
    ? `<rect x="${left - 14}" y="${topY - 20}" width="${width + 28}" height="20" fill="${palette.roof}"/><rect x="${left - 6}" y="${topY - 28}" width="${width + 12}" height="8" fill="${palette.trim}"/>`
    : `<polygon points="${left - 20},${topY + 10} ${left + width / 2},${topY - 64} ${left + width + 20},${topY + 10}" fill="${palette.roof}"/><polygon points="${left - 20},${topY + 10} ${left + width / 2},${topY - 64} ${left + width / 2},${topY + 10}" fill="#FFFFFF" opacity="0.10"/>`;

  const solar = spec.features.includes('Solar-ready')
    ? `<g transform="translate(${left + 48},${topY - (flatRoof ? 16 : 30)})"><rect width="120" height="16" rx="2" fill="#162A3A" stroke="${palette.trim}" stroke-width="2"/><line x1="40" y1="0" x2="40" y2="16" stroke="${palette.trim}"/><line x1="80" y1="0" x2="80" y2="16" stroke="${palette.trim}"/></g>`
    : '';

  const balcony = spec.features.includes('Balcony') && floors > 1
    ? `<rect x="${left + 108}" y="${topY + floorHeight - 2}" width="204" height="8" fill="${palette.trim}"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${left + 114 + i * 24}" y="${topY + floorHeight - 36}" width="4" height="34" fill="${palette.trim}"/>`).join('')}`
    : '';

  const carport = spec.features.includes('Carport')
    ? `<rect x="42" y="${baseY - 92}" width="138" height="9" fill="${palette.roof}"/><rect x="52" y="${baseY - 83}" width="7" height="83" fill="${palette.trim}"/><rect x="164" y="${baseY - 83}" width="7" height="83" fill="${palette.trim}"/><path d="M70 ${baseY - 12} L80 ${baseY - 38} L142 ${baseY - 38} L154 ${baseY - 12} Z" fill="${palette.accent}" opacity="0.85"/><circle cx="88" cy="${baseY - 10}" r="11" fill="#1C2126"/><circle cx="138" cy="${baseY - 10}" r="11" fill="#1C2126"/>`
    : '';

  const greenery = spec.features.includes('Landscaping') || spec.style === 'Tropical'
    ? `<rect x="72" y="${baseY - 42}" width="9" height="42" fill="#7A5A3A"/><circle cx="76" cy="${baseY - 62}" r="34" fill="#6F9B63"/><circle cx="54" cy="${baseY - 48}" r="24" fill="#81AA70"/><rect x="708" y="${baseY - 36}" width="8" height="36" fill="#7A5A3A"/><circle cx="712" cy="${baseY - 58}" r="30" fill="#6F9B63"/><circle cx="732" cy="${baseY - 46}" r="21" fill="#81AA70"/>`
    : `<circle cx="76" cy="${baseY - 12}" r="18" fill="#8FB97C"/><circle cx="724" cy="${baseY - 12}" r="18" fill="#8FB97C"/>`;

  const homeOffice = spec.features.includes('Home office')
    ? `<rect x="${left + width - 122}" y="${baseY - 96}" width="70" height="20" rx="4" fill="${palette.accent}" opacity="0.9"/><text x="${left + width - 87}" y="${baseY - 82}" text-anchor="middle" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="10" letter-spacing="1">OFFICE</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img" aria-label="House design concept">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.skyTop}"/><stop offset="1" stop-color="${palette.skyBottom}"/></linearGradient>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${palette.wallLight}"/><stop offset="1" stop-color="${palette.wall}"/></linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0 L0 0 0 40" fill="none" stroke="#FFFFFF" stroke-opacity="0.09" stroke-width="1"/></pattern>
  </defs>
  <rect width="800" height="600" fill="url(#sky)"/>
  <rect width="800" height="600" fill="url(#grid)"/>
  <circle cx="690" cy="92" r="42" fill="#F7C948" opacity="0.85"/>
  <rect x="0" y="${baseY}" width="800" height="${600 - baseY}" fill="${palette.ground}"/>
  <ellipse cx="400" cy="${baseY + 8}" rx="250" ry="18" fill="#000000" opacity="0.12"/>
  ${greenery}
  ${carport}
  <rect x="${left}" y="${topY}" width="${width}" height="${houseHeight}" fill="url(#wall)" stroke="${palette.trim}" stroke-width="3"/>
  ${windows}
  ${balcony}
  <rect x="378" y="${baseY - 74}" width="62" height="74" rx="3" fill="${palette.roof}"/>
  <circle cx="428" cy="${baseY - 38}" r="3" fill="${palette.accent}"/>
  ${homeOffice}
  ${roof}
  ${solar}
  <rect x="24" y="24" width="286" height="36" rx="7" fill="#1C2126" opacity="0.92"/>
  <text x="40" y="47" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="13" letter-spacing="2">AG CONCEPT · ${area} SQM · ${spec.style.toUpperCase()}</text>
</svg>`;
}
