import type { ApprovedAccessPoint } from '../data/demoSurvey';
import type { Measurement, WiFiFinding, WiFiFindingType } from '../types';

export type IndoorSignalQuality = 'weak' | 'fair' | 'good' | 'unknown';

/** These thresholds apply to recorded signal strength, not throughput or channel congestion. */
export const WIFI_THRESHOLDS = {
  weakIndoorDbm: -70,
  fairIndoorMaxDbm: -67,
  parkingLotLeakageDbm: -67,
} as const;

function isValidSignal(signalDbm: number): boolean {
  return Number.isFinite(signalDbm) && signalDbm >= -120 && signalDbm <= 0;
}

export function classifyIndoorSignal(signalDbm: number): IndoorSignalQuality {
  if (!isValidSignal(signalDbm)) return 'unknown';
  if (signalDbm < WIFI_THRESHOLDS.weakIndoorDbm) return 'weak';
  if (signalDbm <= WIFI_THRESHOLDS.fairIndoorMaxDbm) return 'fair';
  return 'good';
}

function normalizeBssid(bssid: string): string {
  return bssid.trim().toUpperCase();
}

type FindingDetails = Pick<WiFiFinding, 'severity' | 'title' | 'description' | 'recommendations'>;

const FINDING_DETAILS: Record<WiFiFindingType, FindingDetails> = {
  'weak-indoor-signal': {
    severity: 'high',
    title: 'Weak indoor signal',
    description:
      'Indoor readings below -70 dBm suggest weak coverage at the measured locations. Signal strength alone does not establish connection speed or reliability.',
    recommendations: [
      'Check access point placement and obstructions; move the access point toward the affected indoor locations where practical.',
      'If weak coverage remains, consider an additional approved access point with a wired connection.',
      'Repeat measurements at the affected locations after changes to confirm improvement.',
    ],
  },
  'fair-indoor-signal': {
    severity: 'low',
    title: 'Fair indoor signal',
    description:
      'Indoor readings from -70 through -67 dBm indicate fair signal strength. Coverage may need improvement for applications that require a stronger signal.',
    recommendations: [
      'Check whether service at the affected locations meets the business needs and monitor signal strength.',
      'Consider adjusting access point placement or reducing physical obstructions, then repeat the survey.',
    ],
  },
  'possible-signal-leakage': {
    severity: 'medium',
    title: 'Possible parking-lot signal leakage',
    description:
      'An approved access point was measured stronger than -67 dBm in the parking lot. Review whether this outdoor coverage is intended; this is not proof of unauthorized access.',
    recommendations: [
      'Confirm whether parking-lot coverage is intentional, including any approved outdoor guest service.',
      'If coverage extends beyond the intended area, consider lowering transmit power or repositioning the access point or antenna, while preserving needed indoor coverage.',
      'Repeat indoor and parking-lot measurements after changes to verify the intended coverage boundary.',
    ],
  },
  'unrecognized-access-point': {
    severity: 'medium',
    title: 'Unrecognized access point',
    description:
      'The observed BSSID is absent from the approved access point inventory. It may belong to a neighbor or an undocumented device; this does not establish malicious activity.',
    recommendations: [
      'Ask the network administrator to verify the BSSID and ownership against the approved inventory.',
      'If the device is authorized, document it in the approved inventory; otherwise investigate its location and ownership before taking action.',
      'Avoid connecting business devices to the unverified access point during the review.',
    ],
  },
};

/**
 * Analyze a snapshot without changing measurements or the approved inventory.
 * Findings are grouped by issue type and BSSID, with each affected measurement ID included once.
 * Call again with the current data after an edit, deletion, or survey replacement.
 */
export function analyzeWifiMeasurements(
  measurements: readonly Measurement[],
  approvedAccessPoints: readonly ApprovedAccessPoint[],
): WiFiFinding[] {
  const approvedBssids = new Set(approvedAccessPoints.map((ap) => normalizeBssid(ap.bssid)));
  const findings = new Map<string, WiFiFinding>();
  const affectedIds = new Map<string, Set<string>>();

  function addFinding(type: WiFiFindingType, bssid: string, measurementId: string) {
    const id = `${type}:${bssid}`;
    let finding = findings.get(id);
    if (!finding) {
      const details = FINDING_DETAILS[type];
      finding = {
        id,
        type,
        ...details,
        description: `${details.description} Access point BSSID: ${bssid}.`,
        affectedMeasurementIds: [],
        recommendations: [...details.recommendations],
      };
      findings.set(id, finding);
      affectedIds.set(id, new Set());
    }
    const ids = affectedIds.get(id)!;
    if (!ids.has(measurementId)) {
      ids.add(measurementId);
      finding.affectedMeasurementIds.push(measurementId);
    }
  }

  for (const measurement of measurements) {
    const bssid = normalizeBssid(measurement.bssid);
    const isApproved = approvedBssids.has(bssid);

    if (!isApproved) addFinding('unrecognized-access-point', bssid, measurement.id);

    if (measurement.zone === 'Indoor') {
      const quality = classifyIndoorSignal(measurement.signalDbm);
      if (quality === 'weak') addFinding('weak-indoor-signal', bssid, measurement.id);
      if (quality === 'fair') addFinding('fair-indoor-signal', bssid, measurement.id);
    } else if (
      measurement.zone === 'Parking Lot' &&
      isApproved &&
      isValidSignal(measurement.signalDbm) &&
      measurement.signalDbm > WIFI_THRESHOLDS.parkingLotLeakageDbm
    ) {
      addFinding('possible-signal-leakage', bssid, measurement.id);
    }
  }

  return [...findings.values()];
}
