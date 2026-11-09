import { memo, useMemo } from 'react';
import type { Measurement } from '../types';
import { WIFI_THRESHOLDS } from '../lib/wifiAnalysis';
import type { MapPoint } from '../lib/signalEstimate';
import { HEAT_CELL_STEP, buildHeatCells } from '../lib/heatmapGrid';
import { ROOM_LABELS, WALLS } from './floorLayout';
import { heatColor } from './heatColor';

export const SIGNAL_TONES = {
  good: { color: '#15803d', label: `Good: better than ${WIFI_THRESHOLDS.fairIndoorMaxDbm} dBm` },
  fair: {
    color: '#d97706',
    label: `Fair: ${WIFI_THRESHOLDS.weakIndoorDbm} to ${WIFI_THRESHOLDS.fairIndoorMaxDbm} dBm`,
  },
  weak: { color: '#b42318', label: `Weak: below ${WIFI_THRESHOLDS.weakIndoorDbm} dBm` },
} as const;

export type SignalTone = keyof typeof SIGNAL_TONES;

export function signalTone(signalDbm: number): SignalTone {
  if (signalDbm < WIFI_THRESHOLDS.weakIndoorDbm) return 'weak';
  if (signalDbm <= WIFI_THRESHOLDS.fairIndoorMaxDbm) return 'fair';
  return 'good';
}

const WIDTH = 1000;
const HEIGHT = 780;
const PADDING = 20;
const BUILDING_BOTTOM = 572;
const WALL_WIDTH = 8;
const LABEL_HEIGHT = 34;
const LABEL_CHAR_WIDTH = 15;
const MARKER_RADIUS = 17;
const HOVERED_MARKER_RADIUS = 21;
const LABEL_RIGHT_EDGE = WIDTH * 0.8;
const USER_PIN_RADIUS = 10;

function toPixel(point: MapPoint) {
  return {
    cx: PADDING + (point.x / 100) * (WIDTH - PADDING * 2),
    cy: PADDING + (point.y / 100) * (HEIGHT - PADDING * 2),
  };
}

function toMapPoint(svg: SVGSVGElement, clientX: number, clientY: number): MapPoint {
  const rect = svg.getBoundingClientRect();
  const svgX = ((clientX - rect.left) / rect.width) * WIDTH;
  const svgY = ((clientY - rect.top) / rect.height) * HEIGHT;
  const clamp = (value: number) => Math.min(100, Math.max(0, value));
  return {
    x: clamp(((svgX - PADDING) / (WIDTH - PADDING * 2)) * 100),
    y: clamp(((svgY - PADDING) / (HEIGHT - PADDING * 2)) * 100),
  };
}

export function markerPosition(point: MapPoint): { left: string; top: string } {
  const { cx, cy } = toPixel(point);
  return { left: `${(cx / WIDTH) * 100}%`, top: `${(cy / HEIGHT) * 100}%` };
}

interface FloorMapProps {
  measurements: readonly Measurement[];
  unrecognizedIds: ReadonlySet<string>;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  userPoint: MapPoint | null;
  onPickPoint: (point: MapPoint) => void;
}

export function FloorMap({
  measurements,
  unrecognizedIds,
  hoveredId,
  onHover,
  userPoint,
  onPickPoint,
}: FloorMapProps) {
  return (
    <svg
      className="floor-map floor-map-interactive"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Floor map showing estimated Wi-Fi signal across the floor, with each reading at its position"
      onClick={(event) =>
        onPickPoint(toMapPoint(event.currentTarget, event.clientX, event.clientY))
      }
    >
      <defs>
        <filter id="heat-blur" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <pattern id="lot-lines" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M0 56 L28 0" stroke="#ffffff" strokeWidth="5" />
        </pattern>
      </defs>

      <rect x={PADDING} y={PADDING} width={WIDTH - PADDING * 2} height={BUILDING_BOTTOM - PADDING} fill="#f1f5f9" />
      <rect x={PADDING} y={BUILDING_BOTTOM} width={WIDTH - PADDING * 2} height={HEIGHT - BUILDING_BOTTOM - PADDING} fill="#64748b" />

      <HeatLayer measurements={measurements} />

      <g aria-hidden="true" pointerEvents="none" stroke="#ffffff" strokeWidth={WALL_WIDTH} strokeLinecap="square">
        {WALLS.map((wall) => {
          const start = toPixel({ x: wall.x1, y: wall.y1 });
          const end = toPixel({ x: wall.x2, y: wall.y2 });
          return <line key={`${wall.x1}-${wall.y1}-${wall.x2}-${wall.y2}`} x1={start.cx} y1={start.cy} x2={end.cx} y2={end.cy} />;
        })}
      </g>

      <rect x={PADDING} y={BUILDING_BOTTOM} width={WIDTH - PADDING * 2} height={HEIGHT - BUILDING_BOTTOM - PADDING} fill="url(#lot-lines)" opacity={0.7} pointerEvents="none" />
      <rect x={PADDING} y={PADDING} width={WIDTH - PADDING * 2} height={HEIGHT - PADDING * 2} fill="none" stroke="#1e293b" strokeWidth="6" pointerEvents="none" />
      <line x1={PADDING} y1={BUILDING_BOTTOM} x2={WIDTH - PADDING} y2={BUILDING_BOTTOM} stroke="#1e293b" strokeWidth="6" pointerEvents="none" />

      <g aria-hidden="true" pointerEvents="none">
        {ROOM_LABELS.map((room) => {
          const { cx, cy } = toPixel(room);
          const width = room.text.length * LABEL_CHAR_WIDTH + 24;
          return (
            <g key={room.text}>
              <rect x={cx + 8} y={cy + 8} width={width} height={LABEL_HEIGHT} rx={6} fill="#ffffff" opacity={0.92} />
              <text x={cx + 20} y={cy + 8 + LABEL_HEIGHT / 2} dominantBaseline="central" fontSize="18" fontWeight="700" fill="#0f172a">
                {room.text}
              </text>
            </g>
          );
        })}
      </g>

      {measurements.map((measurement) => {
        const { cx, cy } = toPixel(measurement);
        const color = SIGNAL_TONES[signalTone(measurement.signalDbm)].color;
        const label = `${measurement.locationName}: ${measurement.signalDbm} dBm (${measurement.ssid})`;
        const radius = measurement.id === hoveredId ? HOVERED_MARKER_RADIUS : MARKER_RADIUS;
        return (
          <g
            key={measurement.id}
            onPointerEnter={() => onHover(measurement.id)}
            onPointerLeave={() => onHover(null)}
          >
            <title>{label}</title>
            {unrecognizedIds.has(measurement.id) ? (
              <polygon
                points={`${cx},${cy - radius - 2} ${cx + radius + 2},${cy} ${cx},${cy + radius + 2} ${cx - radius - 2},${cy}`}
                fill={color}
                stroke="#0f172a"
                strokeWidth="3"
              />
            ) : (
              <circle cx={cx} cy={cy} r={radius} fill={color} stroke="#ffffff" strokeWidth="4" />
            )}
          </g>
        );
      })}

      <g pointerEvents="none" aria-hidden="true">
        {measurements.map((measurement) => {
          const { cx, cy } = toPixel(measurement);
          const onLeft = cx > LABEL_RIGHT_EDGE;
          const x = onLeft ? cx - MARKER_RADIUS - 10 : cx + MARKER_RADIUS + 10;
          return (
            <text
              key={measurement.id}
              x={x}
              y={cy - 2}
              textAnchor={onLeft ? 'end' : 'start'}
              fontSize="24"
              fill="#0f172a"
              stroke="#ffffff"
              strokeWidth="6"
              paintOrder="stroke"
            >
              <tspan x={x} fontWeight="600">{measurement.locationName}</tspan>
              <tspan x={x} dy="28" fontWeight="700">{measurement.signalDbm} dBm</tspan>
            </text>
          );
        })}
      </g>

      {userPoint && (
        <g pointerEvents="none" aria-hidden="true">
          <UserPin point={userPoint} />
        </g>
      )}
    </svg>
  );
}

const HeatLayer = memo(function HeatLayer({ measurements }: { measurements: readonly Measurement[] }) {
  const cells = useMemo(() => buildHeatCells(measurements), [measurements]);
  const cellWidth = ((WIDTH - PADDING * 2) * HEAT_CELL_STEP) / 100;
  const cellHeight = ((HEIGHT - PADDING * 2) * HEAT_CELL_STEP) / 100;

  return (
    <g aria-hidden="true" pointerEvents="none" filter="url(#heat-blur)" opacity={0.85}>
      {cells.map((cell) => {
        const { cx, cy } = toPixel(cell);
        return (
          <rect
            key={`${cell.x}-${cell.y}`}
            x={cx - cellWidth / 2}
            y={cy - cellHeight / 2}
            width={cellWidth}
            height={cellHeight}
            fill={heatColor(cell.signalDbm)}
          />
        );
      })}
    </g>
  );
});

function UserPin({ point }: { point: MapPoint }) {
  const { cx, cy } = toPixel(point);
  return (
    <>
      <circle className="user-pin-pulse" cx={cx} cy={cy} r={28} />
      <circle cx={cx} cy={cy} r={USER_PIN_RADIUS} fill="#1e5eb8" stroke="#ffffff" strokeWidth="4" />
    </>
  );
}
