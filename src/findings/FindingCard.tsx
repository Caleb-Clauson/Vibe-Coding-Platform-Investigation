import { SEVERITY_LABEL } from '../lib/findingPresentation';
import type { Measurement, WiFiFinding } from '../types';

interface FindingCardProps {
  finding: WiFiFinding;
  measurements: readonly Measurement[];
}

export function FindingCard({ finding, measurements }: FindingCardProps) {
  const affected = finding.affectedMeasurementIds
    .map((id) => measurements.find((measurement) => measurement.id === id))
    .filter((measurement): measurement is Measurement => measurement !== undefined);

  return (
    <article className="card">
      <div className="finding-header">
        <span className={`severity-badge severity-${finding.severity}`}>
          {SEVERITY_LABEL[finding.severity]} priority
        </span>
        <h4>{finding.title}</h4>
      </div>
      <p className="reading-meta">{finding.description}</p>
      <div>
        <p className="finding-label">Affected readings ({affected.length})</p>
        <ul className="detail-list">
          {affected.map((measurement) => (
            <li key={measurement.id}>
              {measurement.locationName} ({measurement.zone}, {measurement.signalDbm} dBm)
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="finding-label">Recommended actions</p>
        <ul className="detail-list">
          {finding.recommendations.map((recommendation) => (
            <li key={recommendation}>{recommendation}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}
