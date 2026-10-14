// Company policies and requirements, transcribed from the AG Construction Builders FAQ slides.
// Keep this file in sync with the official FAQ material.

export const MAIN_OFFICE_ADDRESS = '11912 Villanueva St., Brgy. Mayondon, Los Baños, Laguna';

export const FINISH_PACKAGES = [
  {
    name: 'Standard to Semi-Elegant Finish',
    shortName: 'Standard Finish',
    pricePerSqm: 28000,
    inclusions: [
      'Wall paint accent and painted walls',
      'Flat ceiling',
      'Porcelain floor tiles',
      'Porcelain kitchen counter top and backsplash',
      'Aluminum modular cabinet',
      'Standard aluminum windows',
      'Standard water closet with lavatory',
      'Shower set',
      'Solid main door, flush doors for common rooms',
      'PVC bathroom door',
    ],
  },
  {
    name: 'Elegant Finish',
    shortName: 'Elegant Finish',
    pricePerSqm: 35000,
    inclusions: [
      'Wall tile accent',
      'Grooving wall accent',
      'Water closet with lavatory',
      'Shower set',
      'Granite counter top',
      'Corner glass',
      'Glass railings for stairs',
      'High ceiling',
      'Modular cabinet',
    ],
  },
  {
    name: 'High End-Luxury Finish',
    shortName: 'Luxury Finish',
    pricePerSqm: 45000,
    inclusions: [
      'Stone accent',
      'Granite or quartz counter top',
      'Water closet with lavatory',
      'Shower set',
      'Corner glass',
      'Glass railings for stairs and balcony',
      'Glass bathroom partition',
      'High ceiling',
      'Landscape',
      'Modular cabinet',
    ],
  },
];

export const DESIGN_PACKAGE = {
  price: 60000,
  inclusions: [
    'Master Plan (2D plan, structural, architectural, electrical, plumbing, sanitary)',
    '3D interior and exterior design (perspective view)',
    'Signed and sealed by engineers',
    'Soft copy and A3 hard copy',
    '2 design options',
    '5–7 days process',
  ],
  alaCarte: [
    { label: 'Master Plan only (2D plan)', price: 30000 },
    { label: 'Interior and exterior (3D design only)', price: 25000 },
    { label: 'Master Plan, signed and sealed only', price: 40000 },
  ],
  note: 'We draw an actual, original plan based on your title, lot plan, and the lot measurements taken during the site visit — never a template.',
};

export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Check'];
export const PAYMENT_METHODS_NOTE = 'We do not accept crossed checks.';

export const PROGRESS_BILLING_NOTE =
  'Payment is divided into percentages based on the progress of the project, for the safety and assurance of both the client and the contractor.';

export const PROGRESS_BILLING = [
  {
    scheme: 'Cash Basis',
    stages: [
      { pct: 50, work: 'Excavation, beam, column, electrical and plumbing roughing-in' },
      { pct: 30, work: 'Second floor slab, roofing and trusses, wall partition' },
      { pct: 20, work: 'Ceiling, paint, tiles, windows, doors, water fixtures, cabinets and other remaining work' },
    ],
  },
  {
    scheme: 'Any Bank Loan',
    stages: [
      { pct: 35, work: 'Excavation, beam, column, electrical and plumbing roughing-in' },
      { pct: 30, work: 'Second floor slab, roofing and trusses, wall partition' },
      { pct: 30, work: 'Ceiling, paint, tiles, windows, doors, water fixtures' },
      { pct: 5, work: 'Cabinets and other remaining work' },
    ],
  },
  {
    scheme: 'Pag-IBIG Loan',
    stages: [
      { pct: 35, work: 'Excavation, beam, column, electrical and plumbing roughing-in' },
      { pct: 30, work: 'Second floor slab, roofing and trusses, wall partition' },
      { pct: 30, work: 'Ceiling, paint, tiles, windows, doors, water fixtures' },
      { pct: 5, work: 'Cabinets and other remaining work' },
    ],
  },
];

export const CONSTRUCTION_TIMELINE = [
  { scheme: 'Cash Payment', bungalow: '4–5 months', twoStorey: '5–6 months' },
  { scheme: 'Any Bank Loan', bungalow: '5–6 months', twoStorey: '7–8 months', note: 'Depends on the bank’s release.' },
  { scheme: 'Pag-IBIG Loan', bungalow: '5–6 months', twoStorey: '7–8 months', note: 'Depends on the Pag-IBIG housing release.' },
];
export const TIMELINE_NOTE = 'Working days only — natural disasters and national holidays are excluded.';

export const WARRANTY = {
  scope: 'Private Projects',
  items: [
    {
      term: '1 month',
      title: 'Finishing',
      detail: 'Paint, plumbing leaks, ceiling leaks, hollow tiles, window sealant, roof gutter, electrical.',
    },
    {
      term: '5 years',
      title: 'Structural',
      detail: 'Valid only in the absence of acts of God, natural disasters, or other events beyond human control.',
    },
  ],
  voidNote:
    'The warranty is void if any third party performs construction, renovation, modifications, appliance or furniture installation, repair, or alteration work on the house — before or after turnover — without the contractor’s knowledge or consent.',
};

export const INCLUSIONS = [
  'Doors',
  'Windows',
  'Tiles',
  'Ceiling',
  'Paint',
  'Plumbing',
  'Electrical',
  'Kitchen sink',
  'Water closet with lavatory',
  'Shower set',
  'FREE kitchen cabinet',
  'FREE pin lights',
];

export const EXCLUSIONS = [
  'Appliances (refrigerator, rice cooker, oven, etc.)',
  'Furniture (dining table, chairs, sofa set, bed, office table)',
  'Bathroom mirror',
  'Center light',
  'Stove and range hood',
  'Heater unit',
  'Exhaust fan',
  'Air-condition system',
  'CCTV',
  'Deadbolt for doors',
];

export const CONSTRUCTION_PROCESS = [
  'Design Phase',
  'Approval of Plan',
  'Costing / Proposal',
  'Contract Signing',
  'Building Permit',
  'Ground Breaking',
  'Construction Preparation',
  'Construction Progress',
  'Construction Punch List',
  'Turnover with Certificate',
];

export type Provider = 'client' | 'contractor';

export const DESIGN_REQUIREMENTS = ['Title', 'Design inspiration', 'House requirements', 'Design package payment'];

export const BUILDING_PERMIT_REQUIREMENTS: { item: string; provider?: Provider; note?: string }[] = [
  { item: 'Title', provider: 'client' },
  { item: 'Tax Declaration', provider: 'client' },
  { item: 'Tax Receipt', provider: 'client' },
  { item: 'Cedula for DOLE', provider: 'client' },
  { item: 'Lot Plan', provider: 'client', note: 'If you have none, the contractor may assist.' },
  { item: 'Valid ID', provider: 'client' },
  { item: 'Master Plan' },
  { item: 'Bill of Materials', provider: 'contractor' },
  { item: 'Specifications', provider: 'contractor' },
  { item: 'Structural Analysis', provider: 'contractor' },
  { item: 'Electrical Analysis', provider: 'contractor' },
  { item: 'Barangay Construction Clearance' },
  { item: 'HOA Clearance', note: 'If located in a subdivision.' },
  { item: 'Developer’s Clearance', note: 'If located in a subdivision.' },
];

export const PAGIBIG_REQUIREMENTS = [
  'Pay slip',
  'Certificate of Employment',
  'Certificate of Employment with Compensation',
  'Proof of billing (Meralco, internet, water)',
  'Title',
  'Tax Declaration',
  'Tax Receipt',
  'Master Plan',
  'Bill of Materials (BOM)',
  'Specifications',
  'Building Permit',
];

export const PAGIBIG_CHECKLIST = [
  {
    group: 'Standard',
    items: [
      'Application form with latest two (2) colored 1x1 pictures, with spouse’s signature if applicable',
      'Approved Membership Status Verification Slip (MSVS) — at least 24 months paid membership (₱4,800)',
      'Special Power of Attorney (SPA), if applicable — attorney-in-fact: photocopy of 2 valid government IDs; SPA from abroad: duly authenticated by the Philippine Consulate',
      'Authorized Representative Information Sheet (ARIS), for attorney-in-fact (1 colored 1x1 ID picture)',
      'Photocopy of TIN ID and other government-issued ID — principal borrower and spouse, with three specimen signatures',
      'Health Statement Form',
      'Vicinity Map / Location Plan',
      'Original PSA marriage contract or any document supporting civil status, if applicable',
      'Certified True Copy of the Transfer Certificate of Title (TCT) — latest 3 months',
      'Certified True Copy of the Tax Declaration',
      'Tax Clearance / latest Real Property Tax receipt',
      'Proof of bank account in the Philippines',
      'Joint bank account with the attorney-in-fact, if an SPA is issued',
    ],
  },
  {
    group: 'Locally employed',
    items: [
      'Notarized Certificate of Employment & Compensation (CEC), HDMF format — latest three (3) months',
      'Latest Income Tax Return (ITR)',
      'Pay slips — latest three (3) months',
    ],
  },
  {
    group: 'OFW',
    note: 'With English translation if written in a foreign language, duly authenticated by the Philippine Consulate.',
    items: [
      'Latest Contract of Employment (COE)',
      'Notarized Certificate of Employment & Compensation (CEC) — latest 3 months',
      'Proof of remittance, allotment slips, or pay slips for the past three (3) months',
      'Proof of arrival and departure as evidence for the notarial act',
      'Photocopy of passport',
    ],
  },
];

export const CONTRACTOR_PERMITS = [
  'PCAB Licensed',
  'BIR (updated)',
  'DTI Registered',
  'PhilGEPS Red Registered',
  'Barangay Business Permit',
  'Mayor’s Permit',
];

export const CONTRACTOR_TRAININGS = [
  'Construction Occupational Safety and Health Training (COSH)',
  'Authorized Managing Officers Training (AMO)',
  'Basic Occupational Safety and Health (BOSH)',
  'Safety Officer II (owners)',
  'Construction Standard First Aid Training for office and construction employees',
  'First Aid Training by MDRRMO',
];

export const CONSTRUCTION_SERVICES = [
  { name: 'Vertical Construction', detail: 'Building structures that extend upward — bungalow, 2-storey and up, fence and gate, etc.' },
  { name: 'Horizontal Construction', detail: 'Structures extending across a flat plane — road, drainage system, highway, bridge, railways, pipelines.' },
];

export const SERVICES_OFFERED = [
  'Design Package',
  'Construction of residential, commercial building, resort, etc.',
  'Renovation and extension works',
  'Complete building permit assistance',
];
