import type { Measurement } from '../types';

export interface MapPoint {
  x: number;
  y: number;
}

export interface SignalEstimate {
  signalDbm: number;
  nearest: Measurement;
}

const EXACT_MATCH_DISTANCE = 0.5;

function distanceTo(point: MapPoint, measurement: Measurement): number {
  return Math.hypot(measurement.x - point.x, measurement.y - point.y);
}

export function estimateSignalAt(
  point: MapPoint,
  measurements: readonly Measurement[],
): SignalEstimate | null {
  if (measurements.length === 0) return null;

  const nearest = measurements.reduce((best, candidate) =>
    distanceTo(point, candidate) < distanceTo(point, best) ? candidate : best,
  );
  const nearestDistance = distanceTo(point, nearest);
  if (nearestDistance < EXACT_MATCH_DISTANCE) {
    return { signalDbm: nearest.signalDbm, nearest };
  }

  let weightSum = 0;
  let weightedDbm = 0;
  for (const measurement of measurements) {
    const weight = 1 / distanceTo(point, measurement) ** 2;
    weightSum += weight;
    weightedDbm += weight * measurement.signalDbm;
  }

  return { signalDbm: weightedDbm / weightSum, nearest };
}
