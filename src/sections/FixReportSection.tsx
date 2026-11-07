import { useMeasurements } from '../context/MeasurementContext';
import { APPROVED_ACCESS_POINTS } from '../data/demoSurvey';
import { FindingCard } from '../findings/FindingCard';
import { sortFindingsBySeverity } from '../lib/findingPresentation';

export function FixReportSection() {
  const { measurements, findings } = useMeasurements();
  const sorted = sortFindingsBySeverity(findings);
  const countOf = (severity: 'high' | 'medium' | 'low') =>
    findings.filter((finding) => finding.severity === severity).length;

  return (
    <section className="section-stack" aria-labelledby="report-heading">
      <header className="section-header-row no-print">
        <div className="section-header">
          <h2 id="report-heading">Fix report</h2>
          <p>A summary of findings and recommended fixes. Use Print to save it as a PDF or paper copy.</p>
        </div>
        <button
          type="button"
          className="button button-primary"
          onClick={() => window.print()}
          disabled={measurements.length === 0}
        >
          Print report
        </button>
      </header>

      {measurements.length === 0 ? (
        <p className="empty-state">No readings yet. Add readings in the Survey section to build a report.</p>
      ) : (
        <article className="card fix-report">
          <header className="report-header">
            <h3>Wi-Fi Fix Report</h3>
            <p className="reading-meta">Prepared {new Date().toLocaleDateString()}</p>
          </header>

          <section className="report-block">
            <h4>Summary</h4>
            <p>
              {measurements.length} {measurements.length === 1 ? 'reading' : 'readings'} reviewed.{' '}
              {findings.length === 0
                ? 'No issues were found.'
                : `${findings.length} ${findings.length === 1 ? 'issue' : 'issues'} found: ${countOf('high')} high, ${countOf('medium')} medium, and ${countOf('low')} low priority.`}
            </p>
          </section>

          <section className="report-block">
            <h4>Approved access points</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Network</th>
                  <th scope="col">Access point ID</th>
                  <th scope="col">Placement</th>
                </tr>
              </thead>
              <tbody>
                {APPROVED_ACCESS_POINTS.map((accessPoint) => (
                  <tr key={accessPoint.bssid}>
                    <td>{accessPoint.name}</td>
                    <td>{accessPoint.ssid}</td>
                    <td>{accessPoint.bssid}</td>
                    <td>{accessPoint.placement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="report-block">
            <h4>Findings and recommended fixes</h4>
            {sorted.length === 0 ? (
              <p>No fixes are needed based on the current readings.</p>
            ) : (
              <div className="report-findings">
                {sorted.map((finding) => (
                  <FindingCard key={finding.id} finding={finding} measurements={measurements} />
                ))}
              </div>
            )}
          </section>

          <section className="report-block">
            <h4>All readings</h4>
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">Location</th>
                  <th scope="col">Zone</th>
                  <th scope="col">Network</th>
                  <th scope="col">Access point ID</th>
                  <th scope="col">Signal</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map((measurement) => (
                  <tr key={measurement.id}>
                    <td>{measurement.locationName}</td>
                    <td>{measurement.zone}</td>
                    <td>{measurement.ssid}</td>
                    <td>{measurement.bssid}</td>
                    <td>{measurement.signalDbm} dBm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </article>
      )}
    </section>
  );
}
