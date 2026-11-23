import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import { cn } from '../../lib/cn';

interface DesignView {
  label: string;
  image: string;
}

interface HouseDesignViewerProps {
  image: string;
  views?: DesignView[];
  note?: string;
  compact?: boolean;
}

export default function HouseDesignViewer({ image, views, note, compact = false }: HouseDesignViewerProps) {
  const [index, setIndex] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const dragStartIndex = useRef(0);
  const gallery = views && views.length > 1 ? views : null;
  const current = gallery ? gallery[index] : null;

  const move = (direction: number) => {
    if (!gallery) return;
    setIndex((value) => (value + direction + gallery.length) % gallery.length);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!gallery) return;
    dragStartX.current = event.clientX;
    dragStartIndex.current = index;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!gallery || dragStartX.current === null) return;
    const steps = Math.round((event.clientX - dragStartX.current) / 55);
    setIndex((dragStartIndex.current - steps + gallery.length * 4) % gallery.length);
  };

  const endDrag = () => {
    dragStartX.current = null;
  };

  return (
    <div className={cn('space-y-2', compact ? 'text-[10px]' : 'text-[11px]')}>
      <div
        role={gallery ? 'slider' : undefined}
        aria-label={gallery ? 'Rotate house design' : undefined}
        aria-valuemin={gallery ? 0 : undefined}
        aria-valuemax={gallery ? gallery.length - 1 : undefined}
        aria-valuenow={gallery ? index : undefined}
        tabIndex={gallery ? 0 : undefined}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') move(-1);
          if (event.key === 'ArrowRight') move(1);
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className={cn(
          'overflow-hidden rounded-lg border border-agdark-100 bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-agorange',
          gallery ? 'cursor-grab active:cursor-grabbing' : '',
        )}
        style={{ touchAction: 'pan-y' }}
      >
        <img
          src={current ? current.image : image}
          alt={current ? `${current.label} architectural concept` : 'Generated house design concept'}
          draggable={false}
          className="w-full select-none"
        />
        {gallery ? (
          <div className="flex items-center justify-between border-t border-agdark-100 bg-agdark-800/90 px-2.5 py-1.5 text-white">
            <span className="inline-flex items-center gap-1 font-bold uppercase tracking-wider">
              <RotateCw size={12} />
              360° view
            </span>
            <span className="font-monoData text-[10px] text-agdark-100">{current?.label}</span>
          </div>
        ) : null}
      </div>

      {gallery ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Previous view"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-agdark-200 bg-white text-agdark-700 hover:border-agorange hover:text-agorange"
          >
            <ChevronLeft size={14} />
          </button>
          <input
            type="range"
            min={0}
            max={gallery.length - 1}
            step={1}
            value={index}
            onChange={(event) => setIndex(Number(event.target.value))}
            aria-label="Rotate house design"
            className="h-1 flex-1 accent-agorange"
          />
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Next view"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-agdark-200 bg-white text-agdark-700 hover:border-agorange hover:text-agorange"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      ) : null}

      {note ? <p className="leading-4 text-agdark-500">{note}</p> : null}
    </div>
  );
}
