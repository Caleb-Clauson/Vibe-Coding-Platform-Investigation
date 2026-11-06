import { ZONES, type Measurement } from '../types';

const STORAGE_KEY = 'signalsafe.measurements.v1';

export const SAMPLE_MEASUREMENT: Measurement = {
  id: 'sample-fictional-1',
  locationName: 'SAMPLE: Front lobby (fictional)',
  zone: 'Indoor',
  x: 50,
  y: 40,
  ssid: 'Sample-Demo-Network',
  bssid: '00:00:5E:00:53:01',
  signalDbm: -58,
};

function isMeasurement(value: unknown): value is Measurement {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.locationName === 'string' &&
    ZONES.some((zone) => zone === candidate.zone) &&
    typeof candidate.x === 'number' &&
    typeof candidate.y === 'number' &&
    typeof candidate.ssid === 'string' &&
    typeof candidate.bssid === 'string' &&
    typeof candidate.signalDbm === 'number'
  );
}

export function loadMeasurements(): Measurement[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [SAMPLE_MEASUREMENT];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every(isMeasurement)) return parsed;
  } catch {
    // Storage is unavailable or holds unreadable data; start from the sample reading.
  }
  return [SAMPLE_MEASUREMENT];
}

export function saveMeasurements(measurements: Measurement[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(measurements));
    return true;
  } catch {
    return false;
  }
}
