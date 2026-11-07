import { useMeasurements } from '../context/MeasurementContext';
import { sortFindingsBySeverity } from '../lib/findingPresentation';
import { FindingCard } from '../findings/FindingCard';

export function FindingsSection() {
  const { measurements, findings } = useMeasurements();
  const sorted = sortFindingsBySeverity(findings);

  return (
    <section className="section-stack" aria-labelledby="findings-heading">
      <header className="section-header">
        <h2 id="findings-heading">Findings</h2>
        <p>Issues found in the current readings, listed from highest to lowest priority.</p>
      </header>

      {measurements.length === 0 ? (
        <p className="empty-state">No readings yet. Add readings in the Survey section to see findings.</p>
      ) : findings.length === 0 ? (
        <p className="alert alert-success" role="status">
          No issues found in the current readings.
        </p>
      ) : (
        <ul className="finding-list">
          {sorted.map((finding) => (
            <li key={finding.id}>
              <FindingCard finding={finding} measurements={measurements} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
