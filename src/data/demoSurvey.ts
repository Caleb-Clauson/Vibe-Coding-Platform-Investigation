import type { Measurement } from '../types';

export interface ApprovedAccessPoint {
  name: string;
  ssid: string;
  bssid: string;
  placement: string;
}

export const APPROVED_ACCESS_POINTS: ApprovedAccessPoint[] = [
  {
    name: 'Maple main (indoor)',
    ssid: 'MapleStreet-Staff',
    bssid: '02:A1:B2:C3:D4:01',
    placement: 'Ceiling, dining room',
  },
  {
    name: 'Maple lot (outdoor)',
    ssid: 'MapleStreet-Guest',
    bssid: '02:A1:B2:C3:D4:02',
    placement: 'Light pole, rear parking lot',
  },
];

export const DEMO_MEASUREMENTS: Measurement[] = [
  { id: 'demo-01', locationName: 'Front counter', zone: 'Indoor', x: 12, y: 20, ssid: 'MapleStreet-Staff', bssid: '02:A1:B2:C3:D4:01', signalDbm: -48 },
  { id: 'demo-02', locationName: 'Dining room', zone: 'Indoor', x: 45, y: 35, ssid: 'MapleStreet-Staff', bssid: '02:A1:B2:C3:D4:01', signalDbm: -55 },
  { id: 'demo-03', locationName: 'Kitchen', zone: 'Indoor', x: 72, y: 58, ssid: 'MapleStreet-Staff', bssid: '02:A1:B2:C3:D4:01', signalDbm: -63 },
  { id: 'demo-04', locationName: 'Back office', zone: 'Indoor', x: 88, y: 14, ssid: 'MapleStreet-Staff', bssid: '02:A1:B2:C3:D4:01', signalDbm: -79 },
  { id: 'demo-05', locationName: 'Storage room', zone: 'Indoor', x: 60, y: 90, ssid: 'MapleStreet-Staff', bssid: '02:A1:B2:C3:D4:01', signalDbm: -83 },
  { id: 'demo-06', locationName: 'Parking spot A (entrance)', zone: 'Parking Lot', x: 8, y: 92, ssid: 'MapleStreet-Guest', bssid: '02:A1:B2:C3:D4:02', signalDbm: -52 },
  { id: 'demo-07', locationName: 'Parking spot B (center)', zone: 'Parking Lot', x: 42, y: 96, ssid: 'MapleStreet-Guest', bssid: '02:A1:B2:C3:D4:02', signalDbm: -58 },
  { id: 'demo-08', locationName: 'Parking spot C (rear)', zone: 'Parking Lot', x: 86, y: 82, ssid: 'MapleStreet-Guest', bssid: '02:A1:B2:C3:D4:02', signalDbm: -64 },
  { id: 'demo-09', locationName: 'Dining room east wall', zone: 'Indoor', x: 80, y: 40, ssid: 'Unknown-Network-07', bssid: '02:FF:EE:DD:CC:99', signalDbm: -51 },
  { id: 'demo-10', locationName: 'Parking lot east edge', zone: 'Parking Lot', x: 96, y: 60, ssid: 'Unknown-Network-07', bssid: '02:FF:EE:DD:CC:99', signalDbm: -66 },
];

const COMPARED_FIELDS = ['id', 'locationName', 'zone', 'x', 'y', 'ssid', 'bssid', 'signalDbm'] as const;

function isSameReading(a: Measurement, b: Measurement): boolean {
  return COMPARED_FIELDS.every((field) => a[field] === b[field]);
}

export function isDemoSurvey(measurements: Measurement[]): boolean {
  return (
    measurements.length === DEMO_MEASUREMENTS.length &&
    DEMO_MEASUREMENTS.every((demo) => measurements.some((measurement) => isSameReading(measurement, demo)))
  );
}
