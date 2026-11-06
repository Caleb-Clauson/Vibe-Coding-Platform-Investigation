import { APPROVED_ACCESS_POINTS } from '../data/demoSurvey';

export function ApprovedAccessPoints() {
  return (
    <div className="card">
      <h3>Approved access points</h3>
      <p className="reading-meta">
        Inventory for the fictional demo business. Readings from any other access point are
        unrecognized.
      </p>
      <ul className="reading-list">
        {APPROVED_ACCESS_POINTS.map((accessPoint) => (
          <li key={accessPoint.bssid} className="reading-item">
            <div className="reading-details">
              <h4>{accessPoint.name}</h4>
              <p className="reading-meta">
                Network: {accessPoint.ssid} · Access point: {accessPoint.bssid}
              </p>
              <p className="reading-meta">Placement: {accessPoint.placement}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
