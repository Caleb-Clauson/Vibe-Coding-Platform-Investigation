import type { Measurement } from '../types';
import { WIFI_THRESHOLDS } from '../lib/wifiAnalysis';

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
const HEIGHT = 600;
const PADDING = 20;
const BUILDING_BOTTOM = 440;
const BLOB_RADIUS = 170;
const MARKER_RADIUS = 12;

function toPoint(measurement: Measurement) {
  return {
    cx: PADDING + (measurement.x / 100) * (WIDTH - PADDING * 2),
    cy: PADDING + (measurement.y / 100) * (HEIGHT - PADDING * 2),
  };
}

interface FloorMapProps {
  measurements: readonly Measurement[];
  unrecognizedIds: ReadonlySet<string>;
}

export function FloorMap({ measurements, unrecognizedIds }: FloorMapProps) {
  return (
    <svg
      className="floor-map"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Floor map showing each Wi-Fi reading at its position and colored by signal strength"
    >
      <defs>
        {(Object.keys(SIGNAL_TONES) as SignalTone[]).map((tone) => (
          <radialGradient id={`heat-${tone}`} key={tone}>
            <stop offset="0%" stopColor={SIGNAL_TONES[tone].color} stopOpacity={0.5} />
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

      <g aria-hidden="true">
        {measurements.map((measurement) => {
          const { cx, cy } = toPoint(measurement);
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
        const { cx, cy } = toPoint(measurement);
        const color = SIGNAL_TONES[signalTone(measurement.signalDbm)].color;
        const label = `${measurement.locationName}: ${measurement.signalDbm} dBm (${measurement.ssid})`;
        return (
          <g key={measurement.id}>
            <title>{label}</title>
            {unrecognizedIds.has(measurement.id) ? (
              <polygon
                points={`${cx},${cy - MARKER_RADIUS - 2} ${cx + MARKER_RADIUS + 2},${cy} ${cx},${cy + MARKER_RADIUS + 2} ${cx - MARKER_RADIUS - 2},${cy}`}
                fill={color}
                stroke="#0f172a"
                strokeWidth="3"
              />
            ) : (
              <circle cx={cx} cy={cy} r={MARKER_RADIUS} fill={color} stroke="#ffffff" strokeWidth="4" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
