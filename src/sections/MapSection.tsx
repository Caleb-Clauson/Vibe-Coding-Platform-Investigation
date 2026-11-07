import { useMemo } from 'react';
import { useMeasurements } from '../context/MeasurementContext';
import { FloorMap, SIGNAL_TONES, type SignalTone } from '../map/FloorMap';

const TONE_ORDER: SignalTone[] = ['good', 'fair', 'weak'];

export function MapSection() {
  const { measurements, findings } = useMeasurements();

  const unrecognizedIds = useMemo(
    () =>
      new Set(
        findings
          .filter((finding) => finding.type === 'unrecognized-access-point')
          .flatMap((finding) => finding.affectedMeasurementIds),
      ),
    [findings],
  );

  return (
    <section className="section-stack" aria-labelledby="map-heading">
      <header className="section-header">
        <h2 id="map-heading">Floor map</h2>
        <p>Each reading appears at its saved position. Colors show signal strength at that spot.</p>
      </header>

      {measurements.length === 0 ? (
        <p className="empty-state">No readings to plot yet. Add readings in the Survey section first.</p>
      ) : (
        <div className="card">
          <FloorMap measurements={measurements} unrecognizedIds={unrecognizedIds} />
          <div className="map-legend">
            {TONE_ORDER.map((tone) => (
              <span key={tone} className="map-legend-item">
                <span className="legend-dot" style={{ background: SIGNAL_TONES[tone].color }} />
                {SIGNAL_TONES[tone].label}
              </span>
            ))}
            <span className="map-legend-item">
              <span className="legend-circle" />
              Approved access point
            </span>
            <span className="map-legend-item">
              <span className="legend-diamond" />
              Unrecognized access point
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
