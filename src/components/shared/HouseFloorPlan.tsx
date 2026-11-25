import { useState } from 'react';
import type { HousePlan, RoomKind } from '../../lib/houseLayout';

interface HouseFloorPlanProps {
  plan: HousePlan;
  compact?: boolean;
}

const ROOM_COLORS: Record<RoomKind, string> = {
  living: '#e8eef1',
  dining: '#edf1e9',
  kitchen: '#f3ece4',
  bedroom: '#e9ebf4',
  bathroom: '#e3f0f2',
  office: '#f2e9ef',
  hall: '#f6f6f2',
};

export default function HouseFloorPlan({ plan, compact = false }: HouseFloorPlanProps) {
  const [floor, setFloor] = useState(0);
  const rooms = plan.floorRooms[Math.min(floor, plan.floorRooms.length - 1)] ?? [];
  const padding = 2.4;
  const viewWidth = plan.width + padding * 2;
  const viewHeight = plan.depth + padding * 2;

  return (
    <div className="space-y-2">
      {plan.floors > 1 ? (
        <div className="flex gap-1">
          {plan.floorRooms.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setFloor(index)}
              className={`rounded-md border px-2 py-1 text-[10px] font-bold ${floor === index ? 'border-agdark-800 bg-agdark-800 text-white' : 'border-agdark-200 bg-white text-agdark-600'}`}
            >
              {index === 0 ? 'Ground' : `Floor ${index + 1}`}
            </button>
          ))}
        </div>
      ) : null}
      <svg
        viewBox={`${-viewWidth / 2} ${-viewHeight / 2} ${viewWidth} ${viewHeight}`}
        width="100%"
        height={compact ? 190 : 250}
        role="img"
        aria-label={`Floor ${floor + 1} plan with ${rooms.filter((room) => room.kind === 'bedroom').length} bedrooms and ${rooms.filter((room) => room.kind === 'bathroom').length} bathrooms`}
        className="rounded-lg border border-agdark-100 bg-white"
      >
        <defs>
          <pattern id="planGrid" width="1" height="1" patternUnits="userSpaceOnUse">
            <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#d7dee2" strokeWidth="0.02" />
          </pattern>
        </defs>
        <rect x={-viewWidth / 2} y={-viewHeight / 2} width={viewWidth} height={viewHeight} fill="url(#planGrid)" />
        {rooms.map((room) => (
          <g key={room.id}>
            <rect
              x={room.x - room.w / 2}
              y={room.z - room.d / 2}
              width={room.w}
              height={room.d}
              fill={ROOM_COLORS[room.kind]}
              stroke="#24343d"
              strokeWidth="0.13"
            />
            <text
              x={room.x}
              y={room.z}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#24343d"
              fontSize={Math.min(0.58, room.w / 5)}
              fontFamily="Arial, Helvetica, sans-serif"
              fontWeight="600"
            >
              {room.name}
            </text>
          </g>
        ))}
        <line
          x1={-plan.width / 2}
          y1={plan.depth / 2 + 0.35}
          x2={plan.width / 2}
          y2={plan.depth / 2 + 0.35}
          stroke="#c26a35"
          strokeWidth="0.22"
        />
        <text x={0} y={plan.depth / 2 + 1} textAnchor="middle" fill="#c26a35" fontSize="0.5" fontFamily="Arial, Helvetica, sans-serif" fontWeight="700">
          FRONT ENTRY
        </text>
        <text x={-viewWidth / 2 + 0.4} y={-viewHeight / 2 + 0.9} fill="#617078" fontSize="0.52" fontFamily="Arial, Helvetica, sans-serif">
          {plan.width.toFixed(1)}m × {plan.depth.toFixed(1)}m · {plan.spec.style} · {plan.spec.finish}
        </text>
      </svg>
      <p className="text-[10px] leading-4 text-agdark-500">
        Room allocation responds to {plan.spec.bedrooms} bedrooms, {plan.spec.bathrooms} bathrooms
        {plan.spec.features.includes('Home office') ? ', and the dedicated home office' : ''}.
        {' '}Approximate footprint {plan.footprintArea.toFixed(0)} sqm per level.
      </p>
    </div>
  );
}
