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
