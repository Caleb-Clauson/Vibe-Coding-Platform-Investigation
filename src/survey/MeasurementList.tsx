import type { Measurement } from '../types';

interface MeasurementListProps {
  measurements: Measurement[];
  editingId: string | null;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function MeasurementList({ measurements, editingId, onEdit, onDelete }: MeasurementListProps) {
  if (measurements.length === 0) {
    return <p className="empty-state">No readings yet. Add your first reading using the form.</p>;
  }

  return (
    <ul className="reading-list">
      {measurements.map((measurement) => (
        <li
          key={measurement.id}
          className={`reading-item${measurement.id === editingId ? ' reading-item-active' : ''}`}
        >
          <div className="reading-details">
            <h4>{measurement.locationName}</h4>
            <p className="reading-meta">
              {measurement.zone} · Position {measurement.x}, {measurement.y} · {measurement.signalDbm} dBm
            </p>
            <p className="reading-meta">
              Network: {measurement.ssid} · Access point: {measurement.bssid}
            </p>
          </div>
          <div className="reading-actions">
            <button
              type="button"
              className="button button-secondary"
              aria-label={`Edit ${measurement.locationName}`}
              onClick={() => onEdit(measurement.id)}
            >
              Edit
            </button>
            <button
              type="button"
              className="button button-danger"
              aria-label={`Delete ${measurement.locationName}`}
              onClick={() => onDelete(measurement.id)}
            >
              Delete
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
