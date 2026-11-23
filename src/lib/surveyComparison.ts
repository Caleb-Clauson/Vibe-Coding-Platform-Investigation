import type { Measurement } from '../types';
import { toFormValues, validateMeasurementForm } from './validation';

export interface SurveySnapshot {
  id: string;
  name: string;
  createdAt: string;
  measurements: Measurement[];
}

export const SNAPSHOT_KEY = 'signalsafe.comparisons.v1';

// Names and generated IDs may change; compare the same AP/network at the same position.
export function measurementKey(reading: Measurement): string {
  return JSON.stringify([reading.zone, reading.x, reading.y, reading.ssid.trim(), reading.bssid.trim().toUpperCase()]);
}

export function compareSurveys(before: Measurement[], after: Measurement[]) {
  const group = (readings: Measurement[]) => {
    const groups = new Map<string, Measurement[]>();
    for (const reading of readings) {
      const key = measurementKey(reading);
      groups.set(key, [...(groups.get(key) ?? []), reading]);
    }
    return groups;
  };
  const left = group(before);
  const right = group(after);
  const rows: { before: Measurement; after: Measurement; delta: number }[] = [];
  for (const [key, values] of left) {
    const matches = right.get(key);
    if (values.length === 1 && matches?.length === 1) {
      rows.push({ before: values[0], after: matches[0], delta: matches[0].signalDbm - values[0].signalDbm });
    }
  }
  return {
    rows,
    improved: rows.filter(row => row.delta > 0).length,
    declined: rows.filter(row => row.delta < 0).length,
    unchanged: rows.filter(row => row.delta === 0).length,
    excludedBefore: before.length - rows.length,
    excludedAfter: after.length - rows.length,
    average: rows.length ? rows.reduce((sum, row) => sum + row.delta, 0) / rows.length : null,
  };
}

export function parseSnapshots(raw: string | null): SurveySnapshot[] {
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(item => {
    if (!item || typeof item.id !== 'string' || typeof item.name !== 'string' ||
        typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt)) ||
        !Array.isArray(item.measurements) || !item.measurements.length) return false;
    return item.measurements.every((reading: Measurement) => {
      if (!reading || typeof reading.id !== 'string' || typeof reading.locationName !== 'string' ||
          typeof reading.ssid !== 'string' || typeof reading.bssid !== 'string') return false;
      return Boolean(validateMeasurementForm(toFormValues(reading)).input);
    });
  })) throw new Error('Saved survey history could not be read.');
  return parsed;
}
