import type { Measurement } from '../types';
import { parseSnapshots } from './surveyComparison';

export function exportSurvey(measurements: Measurement[]) {
  return JSON.stringify({ format: 'signalsafe-survey', version: 1, exportedAt: new Date().toISOString(), measurements }, null, 2);
}

export function importSurvey(raw: string): Measurement[] {
  const data = JSON.parse(raw);
  if (data?.format !== 'signalsafe-survey' || data.version !== 1 || !Array.isArray(data.measurements) || data.measurements.length > 2000) {
    throw new Error('Choose a SignalSafe survey export with at most 2,000 readings.');
  }
  if (!data.measurements.length) return [];
  const [validated] = parseSnapshots(JSON.stringify([{ id: 'import', name: 'Imported survey', createdAt: new Date().toISOString(), measurements: data.measurements }]));
  // Imported IDs need not be unique. Assign fresh IDs for editing/deleting individual readings.
  return validated.measurements.map(reading => ({ ...reading, id: crypto.randomUUID() }));
}
