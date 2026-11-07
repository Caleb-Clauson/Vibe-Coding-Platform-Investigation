export const ZONES = ['Indoor', 'Parking Lot'] as const;

export type Zone = (typeof ZONES)[number];

export interface Measurement {
  id: string;
  locationName: string;
  zone: Zone;
  x: number;
  y: number;
  ssid: string;
  bssid: string;
  signalDbm: number;
}

export type MeasurementInput = Omit<Measurement, 'id'>;

export type WiFiFindingType =
  | 'weak-indoor-signal'
  | 'fair-indoor-signal'
  | 'possible-signal-leakage'
  | 'unrecognized-access-point';

export type FindingSeverity = 'high' | 'medium' | 'low';

export interface WiFiFinding {
  /** Stable for the same issue type and normalized BSSID across survey edits. */
  id: string;
  type: WiFiFindingType;
  severity: FindingSeverity;
  title: string;
  description: string;
  affectedMeasurementIds: string[];
  recommendations: string[];
}
