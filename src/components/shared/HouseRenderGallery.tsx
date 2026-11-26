import { Download, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { HouseRenderCapture, LightingMode, RenderView } from './House3DViewer';

export type HouseRenderMode = 'massing' | 'realistic';

export const HOUSE_RENDER_SHOTS: { view: RenderView; lighting: LightingMode }[] = [
  { view: 'front', lighting: 'day' },
  { view: 'corner', lighting: 'day' },
  { view: 'aerial', lighting: 'day' },
  { view: 'front', lighting: 'night' },
  { view: 'corner', lighting: 'night' },
  { view: 'aerial', lighting: 'night' },
];

interface HouseRenderGalleryProps {
  massing: HouseRenderCapture[];
  realistic: HouseRenderCapture[];
  mode: HouseRenderMode;
  onModeChange: (mode: HouseRenderMode) => void;
  view: RenderView;
  lighting: LightingMode;
  onViewChange: (view: RenderView) => void;
  onLightingChange: (lighting: LightingMode) => void;
  generating: boolean;
  progress: string;
  error: string;
  onGenerate: () => void;
  disabled?: boolean;
}

const VIEW_LABELS: Record<RenderView, string> = {
  front: 'Front',
  corner: 'Corner',
  aerial: 'Aerial',
};

const LIGHTING_LABELS: Record<LightingMode, string> = {
  day: 'Day',
  night: 'Night',
};

function findShot(shots: HouseRenderCapture[], view: RenderView, lighting: LightingMode) {
  return shots.find((shot) => shot.view === view && shot.lighting === lighting);
}

export default function HouseRenderGallery({
  massing,
  realistic,
  mode,
  onModeChange,
  view,
  lighting,
  onViewChange,
  onLightingChange,
  generating,
  progress,
  error,
  onGenerate,
  disabled = false,
}: HouseRenderGalleryProps) {
  const selected = findShot(mode === 'realistic' ? realistic : massing, view, lighting);
  const fallback = findShot(massing, view, lighting);
  const shown = selected ?? fallback;
  const usingFallback = mode === 'realistic' && !selected;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-agdark-800 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
        <span className="inline-flex items-center gap-1.5">
          <ImageIcon size={12} />
          Design render preview
        </span>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || disabled || !massing.length}
          className="inline-flex items-center gap-1 rounded border border-agorange px-1.5 py-0.5 text-[9px] text-agorange hover:bg-agdark-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generating ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          {generating ? 'Generating…' : realistic.length ? 'Regenerate realistic' : 'Generate realistic'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <div className="inline-flex overflow-hidden rounded-lg border border-agdark-200 bg-white">
          {(['massing', 'realistic'] as HouseRenderMode[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onModeChange(option)}
              disabled={option === 'realistic' && !realistic.length}
              aria-pressed={mode === option}
              className={cn(
                'px-2.5 py-1 text-[10px] font-bold capitalize transition disabled:cursor-not-allowed disabled:opacity-40',
                mode === option ? 'bg-agorange text-white' : 'text-agdark-600 hover:bg-agdark-50'
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1">
          {(['front', 'corner', 'aerial'] as RenderView[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onViewChange(option)}
              aria-pressed={view === option}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[9px] font-bold capitalize transition',
                view === option
                  ? 'border-agorange bg-agorange text-white'
                  : 'border-agdark-200 bg-white text-agdark-600 hover:border-agorange hover:text-agorange'
              )}
            >
              {VIEW_LABELS[option]}
            </button>
          ))}
          {(['day', 'night'] as LightingMode[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onLightingChange(option)}
              aria-pressed={lighting === option}
              className={cn(
                'rounded-full border px-2 py-0.5 text-[9px] font-bold transition',
                lighting === option
                  ? 'border-agdark-800 bg-agdark-800 text-white'
                  : 'border-agdark-200 bg-white text-agdark-600 hover:border-agdark-400'
              )}
            >
              {LIGHTING_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-[10px] leading-4 text-red-800">{error}</p>
      ) : null}

      {generating ? (
        <p className="text-[10px] leading-4 text-agdark-500">
          {progress || 'Capturing the 3D model and generating photorealistic exterior views…'}
        </p>
      ) : null}

      {shown ? (
        <figure className="overflow-hidden rounded-lg border border-agdark-100 bg-white">
          <img
            src={shown.image}
            alt={`${VIEW_LABELS[view]} ${LIGHTING_LABELS[lighting].toLowerCase()} ${mode} house render`}
            className="aspect-[16/10] w-full bg-agdark-50 object-cover"
          />
          <figcaption className="flex flex-wrap items-center justify-between gap-2 px-2 py-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-agdark-500">
              {VIEW_LABELS[view]} · {LIGHTING_LABELS[lighting]} · {mode}
            </span>
            <a
              href={shown.image}
              download={`ag-house-${view}-${lighting}-${mode}.png`}
              className="inline-flex items-center gap-1 text-[9px] font-bold text-agorange hover:underline"
            >
              <Download size={11} />
              PNG
            </a>
          </figcaption>
        </figure>
      ) : (
        <p className="rounded-lg border border-dashed border-agdark-200 p-3 text-center text-[10px] leading-4 text-agdark-500">
          {generating
            ? 'Capturing the first massing view…'
            : 'Generate a design to create a massing preview and photorealistic exterior renders.'}
        </p>
      )}

      {usingFallback && shown ? (
        <p className="text-[9px] leading-4 text-agdark-400">
          No AI render for this tab yet. Showing the 3D massing capture until you generate realistic views.
        </p>
      ) : null}

      {realistic.length ? (
        <div className="grid grid-cols-6 gap-1.5">
          {HOUSE_RENDER_SHOTS.map(({ view: shotView, lighting: shotLighting }) => {
            const shot = findShot(realistic, shotView, shotLighting);
            const active = shotView === view && shotLighting === lighting;
            return (
              <button
                key={`${shotView}-${shotLighting}`}
                type="button"
                onClick={() => {
                  onViewChange(shotView);
                  onLightingChange(shotLighting);
                  onModeChange('realistic');
                }}
                title={`${VIEW_LABELS[shotView]} · ${LIGHTING_LABELS[shotLighting]}`}
                className={cn(
                  'overflow-hidden rounded border bg-agdark-50 transition',
                  active ? 'border-agorange ring-1 ring-agorange' : 'border-agdark-200 hover:border-agorange'
                )}
              >
                {shot ? (
                  <img src={shot.image} alt="" className="h-10 w-full object-cover" />
                ) : (
                  <span className="flex h-10 items-center justify-center text-[9px] text-agdark-400">—</span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
