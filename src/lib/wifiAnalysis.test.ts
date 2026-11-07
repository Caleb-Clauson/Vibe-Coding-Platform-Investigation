import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { APPROVED_ACCESS_POINTS, DEMO_MEASUREMENTS } from '../data/demoSurvey';
import type { Measurement, WiFiFindingType } from '../types';
import { analyzeWifiMeasurements, classifyIndoorSignal } from './wifiAnalysis';

function reading(overrides: Partial<Measurement> = {}): Measurement {
  return {
    id: 'reading-1',
    locationName: 'Test location',
    zone: 'Indoor',
    x: 50,
    y: 50,
    ssid: APPROVED_ACCESS_POINTS[0].ssid,
    bssid: APPROVED_ACCESS_POINTS[0].bssid,
    signalDbm: -55,
    ...overrides,
  };
}

function analyze(measurements: readonly Measurement[]) {
  return analyzeWifiMeasurements(measurements, APPROVED_ACCESS_POINTS);
}

function findingTypes(measurements: Measurement[]) {
  return analyze(measurements).map((finding) => finding.type).sort();
}

describe('indoor signal thresholds', () => {
  const cases = [
    [-120, 'weak'],
    [-71, 'weak'],
    [-70.01, 'weak'],
    [-70, 'fair'],
    [-69, 'fair'],
    [-68, 'fair'],
    [-67, 'fair'],
    [-66.99, 'good'],
    [-66, 'good'],
    [0, 'good'],
  ] as const;

  for (const [signalDbm, expected] of cases) {
    it(`classifies ${signalDbm} dBm as ${expected} and emits the corresponding finding`, () => {
      assert.equal(classifyIndoorSignal(signalDbm), expected);
      const types = findingTypes([reading({ signalDbm })]);
      assert.deepEqual(types, expected === 'good' ? [] : [`${expected}-indoor-signal`]);
    });
  }

  for (const signalDbm of [NaN, Infinity, -Infinity, -121, 1]) {
    it(`does not make signal claims for invalid signal ${signalDbm}`, () => {
      assert.equal(classifyIndoorSignal(signalDbm), 'unknown');
      assert.deepEqual(analyze([reading({ signalDbm })]), []);
      assert.deepEqual(analyze([reading({ zone: 'Parking Lot', signalDbm })]), []);
    });
  }
});

describe('parking-lot leakage', () => {
  for (const [signalDbm, expectedCount] of [
    [-80, 0], [-70, 0], [-67.01, 0], [-67, 0], [-66.99, 1], [-66, 1], [-52, 1],
  ]) {
    it(`emits ${expectedCount} leakage findings for an approved AP at ${signalDbm} dBm`, () => {
      const findings = analyze([reading({ zone: 'Parking Lot', signalDbm })]);
      assert.equal(findings.length, expectedCount);
      if (expectedCount) assert.equal(findings[0].type, 'possible-signal-leakage');
    });
  }

  it('does not apply indoor rules outside, or leakage rules inside', () => {
    assert.deepEqual(findingTypes([reading({ zone: 'Parking Lot', signalDbm: -85 })]), []);
    assert.deepEqual(findingTypes([reading({ zone: 'Parking Lot', signalDbm: -68 })]), []);
    assert.deepEqual(findingTypes([reading({ signalDbm: -50 })]), []);
  });

  it('requires an approved BSSID even when an outdoor SSID matches the inventory', () => {
    assert.deepEqual(findingTypes([
      reading({ zone: 'Parking Lot', signalDbm: -40, bssid: '02:FF:EE:DD:CC:99' }),
    ]), ['unrecognized-access-point']);
  });

  it('also reviews intentionally placed outdoor APs without asserting unwanted leakage', () => {
    const findings = analyze([
      reading({ zone: 'Parking Lot', signalDbm: -50, bssid: APPROVED_ACCESS_POINTS[1].bssid }),
    ]);
    assert.equal(findings[0].type, 'possible-signal-leakage');
    assert.match(findings[0].recommendations.join(' '), /whether parking-lot coverage is intentional/);
  });
});

describe('approved inventory matching', () => {
  it('recognizes both of Caleb\'s existing approved APs by BSSID', () => {
    for (const ap of APPROVED_ACCESS_POINTS) {
      assert.deepEqual(analyze([reading({ bssid: ap.bssid, ssid: ap.ssid })]), []);
    }
  });

  it('normalizes BSSID case and surrounding whitespace on both sides', () => {
    const inventory = [{ ...APPROVED_ACCESS_POINTS[0], bssid: ' 02:a1:b2:c3:d4:01 ' }];
    assert.deepEqual(analyzeWifiMeasurements([reading()], inventory), []);
    assert.deepEqual(analyze([reading({ bssid: ' 02:a1:b2:c3:d4:01 ' })]), []);
  });

  it('does not approve a BSSID based only on a matching SSID', () => {
    assert.deepEqual(findingTypes([reading({ bssid: '02:FF:EE:DD:CC:99' })]), [
      'unrecognized-access-point',
    ]);
  });

  it('recognizes an approved BSSID even when the SSID changes', () => {
    assert.deepEqual(analyze([reading({ ssid: 'Renamed network' })]), []);
  });

  it('checks unrecognized APs in either zone and independently of signal quality', () => {
    assert.deepEqual(findingTypes([reading({ bssid: '02:FF:EE:DD:CC:99', signalDbm: -80 })]), [
      'unrecognized-access-point', 'weak-indoor-signal',
    ]);
    assert.deepEqual(findingTypes([
      reading({ zone: 'Parking Lot', bssid: '02:FF:EE:DD:CC:99', signalDbm: -80 }),
    ]), ['unrecognized-access-point']);
  });

  it('still checks inventory membership when signal data is invalid', () => {
    assert.deepEqual(findingTypes([reading({ bssid: '02:FF:EE:DD:CC:99', signalDbm: NaN })]), [
      'unrecognized-access-point',
    ]);
  });

  it('treats every observed BSSID as unrecognized when the inventory is empty', () => {
    const findings = analyzeWifiMeasurements([reading()], []);
    assert.equal(findings.length, 1);
    assert.equal(findings[0].type, 'unrecognized-access-point');
  });

  it('recalculates when the approved inventory changes', () => {
    const measurements = [reading({ bssid: '02:FF:EE:DD:CC:99' })];
    assert.equal(analyze(measurements)[0].type, 'unrecognized-access-point');
    assert.deepEqual(analyzeWifiMeasurements(measurements, [
      ...APPROVED_ACCESS_POINTS,
      { ...APPROVED_ACCESS_POINTS[0], bssid: measurements[0].bssid },
    ]), []);
  });
});

describe('finding accuracy and duplicate prevention', () => {
  it('returns no findings for an empty survey', () => {
    assert.deepEqual(analyze([]), []);
  });

  it('matches the exact affected IDs in Caleb\'s unchanged demo survey', () => {
    const findings = analyze(DEMO_MEASUREMENTS);
    assert.deepEqual(findings.map(({ type, affectedMeasurementIds }) => ({ type, affectedMeasurementIds })), [
      { type: 'weak-indoor-signal', affectedMeasurementIds: ['demo-04', 'demo-05'] },
      { type: 'possible-signal-leakage', affectedMeasurementIds: ['demo-06', 'demo-07', 'demo-08'] },
      { type: 'unrecognized-access-point', affectedMeasurementIds: ['demo-09', 'demo-10'] },
    ]);
  });

  it('groups repeated observations of one AP and includes each measurement ID only once', () => {
    const first = reading({ signalDbm: -80 });
    const second = reading({ id: 'reading-2', signalDbm: -85, bssid: first.bssid.toLowerCase() });
    const findings = analyze([first, first, second, second]);
    assert.equal(findings.length, 1);
    assert.deepEqual(findings[0].affectedMeasurementIds, ['reading-1', 'reading-2']);
  });

  it('groups unrecognized AP readings across zones, without merging different BSSIDs', () => {
    const findings = analyze([
      reading({ id: 'a', bssid: '02:FF:EE:DD:CC:99' }),
      reading({ id: 'b', bssid: '02:ff:ee:dd:cc:99', zone: 'Parking Lot' }),
      reading({ id: 'c', bssid: '02:FF:EE:DD:CC:98' }),
    ]);
    assert.equal(findings.length, 2);
    assert.deepEqual(findings.map((finding) => finding.affectedMeasurementIds), [['a', 'b'], ['c']]);
    assert.equal(new Set(findings.map((finding) => finding.id)).size, 2);
  });

  it('keeps different issue types separate for the same BSSID', () => {
    const findings = analyze([
      reading({ id: 'weak', signalDbm: -80 }),
      reading({ id: 'fair', signalDbm: -70 }),
      reading({ id: 'outside', zone: 'Parking Lot', signalDbm: -50 }),
    ]);
    assert.equal(findings.length, 3);
    assert.equal(new Set(findings.map((finding) => finding.id)).size, 3);
    assert.deepEqual(findings.map((finding) => finding.affectedMeasurementIds), [['weak'], ['fair'], ['outside']]);
  });

  it('does not duplicate findings when the approved inventory contains duplicate entries', () => {
    const findings = analyzeWifiMeasurements([reading({ zone: 'Parking Lot', signalDbm: -50 })], [
      ...APPROVED_ACCESS_POINTS, ...APPROVED_ACCESS_POINTS,
    ]);
    assert.equal(findings.length, 1);
    assert.deepEqual(findings[0].affectedMeasurementIds, ['reading-1']);
  });

  it('repeated analysis is deterministic and does not accumulate old results', () => {
    const first = analyze(DEMO_MEASUREMENTS);
    assert.deepEqual(analyze(DEMO_MEASUREMENTS), first);
    assert.deepEqual(analyze([]), []);
    assert.deepEqual(analyze(DEMO_MEASUREMENTS), first);
  });

  it('removes resolved issues after signal, BSSID, zone, and deletion changes', () => {
    const weak = reading({ signalDbm: -80 });
    assert.deepEqual(findingTypes([weak]), ['weak-indoor-signal']);
    assert.deepEqual(findingTypes([{ ...weak, signalDbm: -70 }]), ['fair-indoor-signal']);
    assert.deepEqual(findingTypes([{ ...weak, signalDbm: -55 }]), []);
    assert.deepEqual(findingTypes([{ ...weak, zone: 'Parking Lot' }]), []);
    const unknown = reading({ bssid: '02:FF:EE:DD:CC:99' });
    assert.deepEqual(findingTypes([unknown]), ['unrecognized-access-point']);
    assert.deepEqual(findingTypes([{ ...unknown, bssid: APPROVED_ACCESS_POINTS[0].bssid }]), []);
    assert.deepEqual(analyze([]), []);
  });

  it('retains a stable finding ID when the same issue gains or loses affected readings', () => {
    const first = reading({ signalDbm: -80 });
    const second = reading({ id: 'reading-2', signalDbm: -85 });
    assert.equal(analyze([first])[0].id, analyze([second, first])[0].id);
    assert.equal(analyze([first])[0].id, analyze([second])[0].id);
  });

  it('does not mutate source data, and returned arrays do not leak between calls', () => {
    const measurements = Object.freeze([Object.freeze(reading({ signalDbm: -80 }))]);
    const inventory = Object.freeze(APPROVED_ACCESS_POINTS.map((ap) => Object.freeze({ ...ap })));
    const first = analyzeWifiMeasurements(measurements, inventory);
    first[0].affectedMeasurementIds.push('unrelated');
    first[0].recommendations.length = 0;
    const next = analyzeWifiMeasurements(measurements, inventory);
    assert.deepEqual(next[0].affectedMeasurementIds, ['reading-1']);
    assert.ok(next[0].recommendations.length > 0);
    assert.equal(measurements[0].signalDbm, -80);
  });

  it('provides severity, title, description, affected IDs, and actionable recommendations for every issue', () => {
    const expectedSeverities: Record<WiFiFindingType, string> = {
      'weak-indoor-signal': 'high',
      'fair-indoor-signal': 'low',
      'possible-signal-leakage': 'medium',
      'unrecognized-access-point': 'medium',
    };
    const findings = analyze([...DEMO_MEASUREMENTS, reading({ id: 'fair', signalDbm: -67 })]);
    assert.equal(findings.length, 4);
    for (const finding of findings) {
      assert.equal(finding.severity, expectedSeverities[finding.type]);
      assert.ok(finding.title.length > 0);
      assert.match(finding.description, /BSSID:/);
      assert.ok(finding.affectedMeasurementIds.length > 0);
      assert.ok(finding.recommendations.length > 0);
      assert.ok(finding.recommendations.every((recommendation) => recommendation.length > 0));
    }
    const unknown = findings.find((finding) => finding.type === 'unrecognized-access-point')!;
    assert.match(unknown.description, /does not establish malicious activity/);
  });
});
