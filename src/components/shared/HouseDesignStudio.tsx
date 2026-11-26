import { useEffect, useState, type ReactNode } from 'react';
import { Check, Copy, Image as ImageIcon, Send, Shuffle, Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn';
import { DESIGN_PACKAGE } from '../../lib/companyInfo';
import House3DViewer from './House3DViewer';
import {
  DESIGN_FEATURES,
  DESIGN_STYLES,
  FINISH_OPTIONS,
  HOME_TYPES,
  buildDesignPrompt,
  createHouseDesignSpec,
  estimateHouseDesign,
  formatPeso,
  type DesignFeature,
  type FinishOption,
  type HomeType,
  type HouseDesignEstimate,
  type HouseDesignSpec,
} from '../../lib/houseDesign';

interface HouseDesignStudioProps {
  onAskAssistant: (prompt: string) => void;
}

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition',
        active
          ? 'border-agorange bg-agorange text-white'
          : 'border-agdark-200 bg-white text-agdark-600 hover:border-agorange hover:text-agorange'
      )}
    >
      {children}
    </button>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (value: number) => void;
}

function NumberField({ label, value, min, max, suffix, onChange }: NumberFieldProps) {
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const parsed = Number(draft);
    const next = Math.min(max, Math.max(min, Number.isFinite(parsed) ? Math.round(parsed) : min));
    onChange(next);
    setDraft(String(next));
  };

  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-agdark-500">{label}</span>
      <div className="flex items-center rounded-lg border border-agdark-200 bg-white focus-within:border-agorange">
        <input
          type="number"
          value={draft}
          min={min}
          max={max}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && commit()}
          className="min-w-0 flex-1 bg-transparent px-2.5 py-1.5 text-sm font-semibold text-agdark-800 focus:outline-none"
        />
        {suffix ? <span className="pr-2.5 text-[10px] text-agdark-400">{suffix}</span> : null}
      </div>
    </label>
  );
}

export default function HouseDesignStudio({ onAskAssistant }: HouseDesignStudioProps) {
  const [spec, setSpec] = useState<HouseDesignSpec>(createHouseDesignSpec);
  const [result, setResult] = useState<{ estimate: HouseDesignEstimate; prompt: string } | null>(null);
  const [modelSpec, setModelSpec] = useState<HouseDesignSpec | null>(null);
  const [variant, setVariant] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);

  const update = <K extends keyof HouseDesignSpec>(key: K, value: HouseDesignSpec[K]) => {
    setSpec((current) => ({ ...current, [key]: value }));
  };

  const toggleFeature = (feature: DesignFeature) => {
    setSpec((current) => ({
      ...current,
      features: current.features.includes(feature)
        ? current.features.filter((item) => item !== feature)
        : [...current.features, feature],
    }));
  };

  const nextVariant = (current: number) => current + 1;

  const generate = () => {
    const estimate = estimateHouseDesign(spec);
    setResult({ estimate, prompt: buildDesignPrompt(spec, estimate) });
    setModelSpec(null);
    setNote('');
    setCopied(false);
  };

  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.prompt);
    } catch {
      const field = document.createElement('textarea');
      field.value = result.prompt;
      document.body.appendChild(field);
      try {
        field.select();
        document.execCommand('copy');
      } finally {
        field.remove();
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const render = () => {
    if (!result) return;
    setModelSpec({ ...spec });
    setVariant((current) => nextVariant(current));
    setNote('Interactive 3D model generated from your specs. Use Shuffle for another variation, or the Floor plan button to inspect room allocation. For construction-ready plans, avail the design package.');
  };

  return (
    <div className="space-y-3">
      <div className="blueprint-grid-light rounded-xl border border-agdark-100 bg-white px-3 py-3">
        <p className="eyebrow">House design studio</p>
        <h3 className="font-display text-xl font-bold uppercase leading-tight text-agdark-800">Design your house</h3>
        <p className="mt-1 text-[11px] leading-4 text-agdark-500">Pick specs, see a rough cost, then generate an interactive 3D house design.</p>
      </div>

      <section className="space-y-2 rounded-xl border border-agdark-100 bg-white p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-agdark-500">1 · House type</p>
        <div className="grid grid-cols-3 gap-1.5">
          {HOME_TYPES.map((type: HomeType) => (
            <button
              key={type}
              type="button"
              onClick={() => update('homeType', type)}
              aria-pressed={spec.homeType === type}
              className={cn(
                'rounded-lg border px-1 py-2 text-[11px] font-bold transition',
                spec.homeType === type
                  ? 'border-agdark-800 bg-agdark-800 text-white'
                  : 'border-agdark-200 bg-white text-agdark-600 hover:border-agdark-400'
              )}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <NumberField label="Floor area" value={spec.floorArea} min={20} max={1000} suffix="sqm" onChange={(value) => update('floorArea', value)} />
          <NumberField label="Bedrooms" value={spec.bedrooms} min={1} max={10} onChange={(value) => update('bedrooms', value)} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="Bathrooms" value={spec.bathrooms} min={1} max={10} onChange={(value) => update('bathrooms', value)} />
          <label className="flex items-end gap-2 rounded-lg border border-agdark-200 bg-white px-2.5 py-1.5">
            <input
              type="checkbox"
              checked={spec.includeDesignPackage}
              onChange={(e) => update('includeDesignPackage', e.target.checked)}
              className="mb-1 h-3.5 w-3.5 shrink-0 accent-agorange"
            />
            <span>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-agdark-500">Design package</span>
              <span className="font-monoData text-[11px] font-semibold text-agdark-700">{formatPeso(DESIGN_PACKAGE.price)}</span>
            </span>
          </label>
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-agdark-100 bg-white p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-agdark-500">2 · Finish package</p>
        <div className="grid grid-cols-3 gap-1.5">
          {FINISH_OPTIONS.map((option: FinishOption) => (
            <button
              key={option}
              type="button"
              onClick={() => update('finish', option)}
              aria-pressed={spec.finish === option}
              className={cn(
                'rounded-lg border px-1.5 py-2 text-left transition',
                spec.finish === option
                  ? 'border-agorange bg-agorange-50 ring-1 ring-agorange'
                  : 'border-agdark-200 bg-white hover:border-agorange'
              )}
            >
              <span className="block text-[10px] font-bold leading-tight text-agdark-800">{option}</span>
              <span className="font-monoData text-[9px] text-agdark-500">
                {formatPeso(estimateHouseDesign({ ...spec, finish: option }).ratePerSqm)}/sqm
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-agdark-100 bg-white p-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-agdark-500">3 · Style & must-haves</p>
        <div className="flex flex-wrap gap-1.5">
          {DESIGN_STYLES.map((style) => (
            <Chip key={style} active={spec.style === style} onClick={() => update('style', style)}>{style}</Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-agdark-100 pt-2">
          {DESIGN_FEATURES.map((feature) => (
            <Chip key={feature} active={spec.features.includes(feature)} onClick={() => toggleFeature(feature)}>{feature}</Chip>
          ))}
        </div>
      </section>

      <button type="button" onClick={generate} className="btn-primary w-full">
        <Sparkles size={15} />
        {result ? 'Regenerate quote & prompt' : 'Generate quote & prompt'}
      </button>

      {result ? (
        <section className="space-y-3 rounded-xl border border-agorange-200 bg-agorange-50/70 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-agorange">Preliminary estimate</p>
              <p className="font-display text-2xl font-bold leading-none text-agdark-800">{formatPeso(result.estimate.total)}</p>
              <p className="mt-1 font-monoData text-[9px] text-agdark-500">
                {spec.floorArea} sqm × {formatPeso(result.estimate.ratePerSqm)}/sqm{result.estimate.design ? ' + design' : ''}
              </p>
            </div>
            <Sparkles size={18} className="shrink-0 text-agorange" />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-agdark-500">Design prompt</p>
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1 rounded-md border border-agdark-200 bg-white px-2 py-1 text-[10px] font-bold text-agdark-600 hover:border-agorange hover:text-agorange"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy prompt'}
              </button>
            </div>
            <pre className="max-h-28 overflow-auto whitespace-pre-wrap rounded-lg border border-agdark-100 bg-white p-2 text-[10px] leading-4 text-agdark-600">
              {result.prompt}
            </pre>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={render} className="btn-primary h-9 flex-1 px-3 text-xs">
              <ImageIcon size={14} />
              Generate 3D design
            </button>
            <button
              type="button"
              onClick={() => onAskAssistant(result.prompt)}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-agdark-800 px-3 text-xs font-bold text-agdark-800 hover:bg-agdark-800 hover:text-white"
            >
              <Send size={14} />
              Ask AG
            </button>
            <button
              type="button"
              onClick={() => setVariant((current) => nextVariant(current))}
              disabled={!modelSpec}
              title="Generate another 3D variation"
              aria-label="Generate another 3D variation"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-agdark-100 text-agdark-800 hover:bg-agdark-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Shuffle size={14} />
            </button>
          </div>

          {modelSpec ? (
            <div className="space-y-2">
              <House3DViewer spec={modelSpec} height={340} seed={variant} />
              {note ? <p className="text-[10px] leading-4 text-agdark-500">{note}</p> : null}
            </div>
          ) : null}

          <p className="text-[9px] leading-4 text-agdark-400">{result.estimate.disclaimer}</p>
        </section>
      ) : null}
    </div>
  );
}
