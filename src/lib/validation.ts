import { ZONES, type Measurement, type MeasurementInput } from '../types';

export interface MeasurementFormValues {
  locationName: string;
  zone: string;
  x: string;
  y: string;
  ssid: string;
  bssid: string;
  signalDbm: string;
}

export type MeasurementFormErrors = Partial<Record<keyof MeasurementFormValues, string>>;

export const EMPTY_FORM_VALUES: MeasurementFormValues = {
  locationName: '',
  zone: 'Indoor',
  x: '',
  y: '',
  ssid: '',
  bssid: '',
  signalDbm: '',
};

const BSSID_PATTERN = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;

export function toFormValues(measurement: Measurement): MeasurementFormValues {
  return {
    locationName: measurement.locationName,
    zone: measurement.zone,
    x: String(measurement.x),
    y: String(measurement.y),
    ssid: measurement.ssid,
    bssid: measurement.bssid,
    signalDbm: String(measurement.signalDbm),
  };
}

function parseNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

function positionError(raw: string, label: string): string | undefined {
  const name = label.toLowerCase();
  if (raw.trim() === '') return `Enter a ${name} position from 0 to 100.`;
  const value = parseNumber(raw);
  if (value === null) return `The ${name} position must be a number from 0 to 100.`;
  if (value < 0 || value > 100) return `The ${name} position must be between 0 and 100.`;
  return undefined;
}

function signalError(raw: string): string | undefined {
  if (raw.trim() === '') return 'Enter the signal strength in dBm, for example -55.';
  const value = parseNumber(raw);
  if (value === null) return 'Signal strength must be a number, for example -55.';
  if (!Number.isInteger(value)) return 'Use a whole number for signal strength, for example -55.';
  if (value < -120 || value > 0) return 'Signal strength should be between -120 and 0 dBm.';
  return undefined;
}

export function validateMeasurementForm(
  values: MeasurementFormValues,
): { errors: MeasurementFormErrors; input: MeasurementInput | null } {
  const errors: MeasurementFormErrors = {};

  const locationName = values.locationName.trim();
  if (locationName === '') {
    errors.locationName = "Enter a location name, such as 'Front desk'.";
  } else if (locationName.length > 60) {
    errors.locationName = 'Keep the location name to 60 characters or fewer.';
  }

  const zone = ZONES.find((option) => option === values.zone);
  if (!zone) errors.zone = 'Choose Indoor or Parking Lot.';

  const xError = positionError(values.x, 'Horizontal');
  if (xError) errors.x = xError;
  const yError = positionError(values.y, 'Vertical');
  if (yError) errors.y = yError;

  const ssid = values.ssid.trim();
  if (ssid === '') {
    errors.ssid = 'Enter the network name (SSID) exactly as it appears on your device.';
  } else if (ssid.length > 32) {
    errors.ssid = 'Network names can be at most 32 characters.';
  }

  const bssid = values.bssid.trim().toUpperCase();
  if (bssid === '') {
    errors.bssid = 'Enter the access point ID (BSSID), such as AA:BB:CC:DD:EE:FF.';
  } else if (!BSSID_PATTERN.test(bssid)) {
    errors.bssid = 'Use six pairs of letters or numbers separated by colons, such as AA:BB:CC:DD:EE:FF.';
  }

  const signalMessage = signalError(values.signalDbm);
  if (signalMessage) errors.signalDbm = signalMessage;

  const x = parseNumber(values.x);
  const y = parseNumber(values.y);
  const signalDbm = parseNumber(values.signalDbm);

  if (Object.keys(errors).length > 0 || !zone || x === null || y === null || signalDbm === null) {
    return { errors, input: null };
  }

  return {
    errors,
    input: { locationName, zone, x, y, ssid, bssid, signalDbm },
  };
}
