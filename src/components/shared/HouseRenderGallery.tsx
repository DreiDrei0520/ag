import { Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import type { HouseRenderCapture, LightingMode, RenderView } from './House3DViewer';

interface HouseRenderGalleryProps {
  renders: HouseRenderCapture[];
  rendering: boolean;
  onGenerate: () => void;
  disabled?: boolean;
}

const VIEW_LABELS: Record<RenderView, string> = {
  front: 'Front elevation',
  corner: 'Corner view',
  aerial: 'Aerial view',
};

const LIGHTING_LABELS: Record<LightingMode, string> = {
  day: 'Daylight',
  night: 'Night',
};

export default function HouseRenderGallery({
  renders,
  rendering,
  onGenerate,
  disabled = false,
}: HouseRenderGalleryProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-lg bg-agdark-800 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
        <span className="inline-flex items-center gap-1.5">
          <ImageIcon size={12} />
          Photorealistic renders
        </span>
        <button
          type="button"
          onClick={onGenerate}
          disabled={rendering || disabled}
          className="inline-flex items-center gap-1 rounded border border-agorange px-1.5 py-0.5 text-[9px] text-agorange hover:bg-agdark-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {rendering ? <Loader2 size={11} className="animate-spin" /> : null}
          {rendering ? 'Rendering…' : 'Re-render'}
        </button>
      </div>

      {rendering ? (
        <p className="text-[10px] leading-4 text-agdark-500">Rendering daylight and night views from this exact 3D model…</p>
      ) : null}

      {renders.length ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {renders.map((render, index) => (
            <figure key={`${render.view}-${render.lighting}-${index}`} className="overflow-hidden rounded-lg border border-agdark-100 bg-white">
              <img
                src={render.image}
                alt={`${VIEW_LABELS[render.view]} in ${LIGHTING_LABELS[render.lighting].toLowerCase()}`}
                className="h-36 w-full object-cover"
              />
              <figcaption className="flex items-center justify-between gap-2 px-2 py-1.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-agdark-500">
                  {VIEW_LABELS[render.view]} · {LIGHTING_LABELS[render.lighting]}
                </span>
                <a
                  href={render.image}
                  download={`ag-house-${render.view}-${render.lighting}.png`}
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-agorange hover:underline"
                >
                  <Download size={11} />
                  PNG
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : !rendering ? (
        <p className="rounded-lg border border-dashed border-agdark-200 p-3 text-center text-[10px] leading-4 text-agdark-500">
          Generate a design to create professional 1920×1200 renders from the same model.
        </p>
      ) : null}
    </div>
  );
}
