import type { MapPoint, SignalEstimate } from '../lib/signalEstimate';
import { SIGNAL_TONES, signalTone } from './FloorMap';

interface UserLocationPanelProps {
  point: MapPoint | null;
  estimate: SignalEstimate | null;
  onClear: () => void;
}

export function UserLocationPanel({ point, estimate, onClear }: UserLocationPanelProps) {
  if (!point || !estimate) {
    return (
      <section className="card">
        <h3>Your location</h3>
        <p className="reading-meta">
          Click anywhere on the map to place your location and see the estimated signal strength
          there. Hover over a reading to see its details.
        </p>
      </section>
    );
  }

  const signal = Math.round(estimate.signalDbm);
  const tone = SIGNAL_TONES[signalTone(signal)];

  return (
    <section className="card" aria-live="polite">
      <h3>Your location</h3>
      <div className="user-location-reading">
        <span className="legend-dot" style={{ background: tone.color }} />
        <p className="user-location-value">{signal} dBm</p>
      </div>
      <p>{tone.label}</p>
      <p className="reading-meta">
        Estimated from every reading on the map, weighted toward the closest ones. Nearest reading:{' '}
        {estimate.nearest.locationName} ({estimate.nearest.signalDbm} dBm).
      </p>
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onClear}>
          Remove marker
        </button>
      </div>
    </section>
  );
}
