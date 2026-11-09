import type { Measurement } from '../types';
import { SIGNAL_TONES, markerPosition, signalTone } from './FloorMap';

interface MapReadingTooltipProps {
  measurement: Measurement;
  unrecognized: boolean;
}

export function MapReadingTooltip({ measurement, unrecognized }: MapReadingTooltipProps) {
  const { left, top } = markerPosition(measurement);
  const edge = measurement.x > 75 ? 'end' : measurement.x < 25 ? 'start' : 'center';
  const tone = SIGNAL_TONES[signalTone(measurement.signalDbm)];

  return (
    <div className={`floor-tooltip floor-tooltip-${edge}`} style={{ left, top }} role="tooltip">
      <p className="floor-tooltip-title">{measurement.locationName}</p>
      <p>
        <span className="legend-dot" style={{ background: tone.color }} /> {measurement.signalDbm} dBm
      </p>
      <p className="floor-tooltip-meta">{tone.label}</p>
      <p className="floor-tooltip-meta">
        {measurement.zone} · {measurement.ssid}
      </p>
      <p className="floor-tooltip-meta">Access point: {measurement.bssid}</p>
      <p className="floor-tooltip-meta">
        {unrecognized ? 'Unrecognized access point' : 'Approved access point'}
      </p>
    </div>
  );
}
