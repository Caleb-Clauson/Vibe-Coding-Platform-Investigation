import type { Measurement } from '../types';
import { WIFI_THRESHOLDS } from '../lib/wifiAnalysis';
import type { MapPoint } from '../lib/signalEstimate';

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
const BLOB_RADIUS = 220;
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
      aria-label="Floor map showing each Wi-Fi reading at its position and colored by signal strength"
      onClick={(event) =>
        onPickPoint(toMapPoint(event.currentTarget, event.clientX, event.clientY))
      }
    >
      <defs>
        {(Object.keys(SIGNAL_TONES) as SignalTone[]).map((tone) => (
          <radialGradient id={`heat-${tone}`} key={tone}>
            <stop offset="0%" stopColor={SIGNAL_TONES[tone].color} stopOpacity={0.6} />
            <stop offset="100%" stopColor={SIGNAL_TONES[tone].color} stopOpacity={0} />
          </radialGradient>
        ))}
        <pattern id="lot-lines" width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M0 56 L28 0" stroke="#94a3b8" strokeWidth="3" />
        </pattern>
      </defs>

      <rect x={PADDING} y={PADDING} width={WIDTH - PADDING * 2} height={BUILDING_BOTTOM - PADDING} fill="#f8fafc" stroke="#94a3b8" strokeWidth="4" />
      <rect x={PADDING} y={BUILDING_BOTTOM} width={WIDTH - PADDING * 2} height={HEIGHT - BUILDING_BOTTOM - PADDING} fill="#e2e8f0" stroke="#94a3b8" strokeWidth="4" />
      <rect x={PADDING} y={BUILDING_BOTTOM} width={WIDTH - PADDING * 2} height={HEIGHT - BUILDING_BOTTOM - PADDING} fill="url(#lot-lines)" opacity={0.6} />

      <g aria-hidden="true" pointerEvents="none">
        {measurements.map((measurement) => {
          const { cx, cy } = toPixel(measurement);
          return (
            <circle
              key={measurement.id}
              cx={cx}
              cy={cy}
              r={BLOB_RADIUS}
              fill={`url(#heat-${signalTone(measurement.signalDbm)})`}
            />
          );
        })}
      </g>

      <text x={PADDING + 16} y={PADDING + 40} fontSize="22" fontWeight="600" fill="#334155">INDOOR</text>
      <text x={PADDING + 16} y={BUILDING_BOTTOM + 40} fontSize="22" fontWeight="600" fill="#334155">PARKING LOT</text>

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

function UserPin({ point }: { point: MapPoint }) {
  const { cx, cy } = toPixel(point);
  return (
    <>
      <circle className="user-pin-pulse" cx={cx} cy={cy} r={28} />
      <circle cx={cx} cy={cy} r={USER_PIN_RADIUS} fill="#1e5eb8" stroke="#ffffff" strokeWidth="4" />
    </>
  );
}
