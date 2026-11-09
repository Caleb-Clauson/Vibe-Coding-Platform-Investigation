import { useMemo, useState } from 'react';
import { useMeasurements } from '../context/MeasurementContext';
import { estimateSignalAt, type MapPoint } from '../lib/signalEstimate';
import { FloorMap, SIGNAL_TONES, type SignalTone } from '../map/FloorMap';
import { MapReadingTooltip } from '../map/MapReadingTooltip';
import { UserLocationPanel } from '../map/UserLocationPanel';

const TONE_ORDER: SignalTone[] = ['good', 'fair', 'weak'];

export function MapSection() {
  const { measurements, findings } = useMeasurements();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [userPoint, setUserPoint] = useState<MapPoint | null>(null);

  const unrecognizedIds = useMemo(
    () =>
      new Set(
        findings
          .filter((finding) => finding.type === 'unrecognized-access-point')
          .flatMap((finding) => finding.affectedMeasurementIds),
      ),
    [findings],
  );

  const hovered = measurements.find((measurement) => measurement.id === hoveredId) ?? null;
  const estimate = useMemo(
    () => (userPoint ? estimateSignalAt(userPoint, measurements) : null),
    [userPoint, measurements],
  );

  return (
    <section className="section-stack" aria-labelledby="map-heading">
      <header className="section-header">
        <h2 id="map-heading">Floor map</h2>
        <p>Colors show the estimated signal across the floor, based on your readings. Hover over a reading for details, or click the map to see the estimated signal at that spot.</p>
      </header>

      {measurements.length === 0 ? (
        <p className="empty-state">No readings to plot yet. Add readings in the Survey section first.</p>
      ) : (
        <>
          <div className="card">
            <div className="floor-map-frame">
              <FloorMap
                measurements={measurements}
                unrecognizedIds={unrecognizedIds}
                hoveredId={hoveredId}
                onHover={setHoveredId}
                userPoint={userPoint}
                onPickPoint={setUserPoint}
              />
              {hovered && (
                <MapReadingTooltip
                  measurement={hovered}
                  unrecognized={unrecognizedIds.has(hovered.id)}
                />
              )}
            </div>
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
              <span className="map-legend-item">
                <span className="legend-you" />
                Your location
              </span>
            </div>
          </div>
          <UserLocationPanel
            point={userPoint}
            estimate={estimate}
            onClear={() => setUserPoint(null)}
          />
        </>
      )}
    </section>
  );
}
