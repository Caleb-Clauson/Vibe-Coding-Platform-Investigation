import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { compareSurveys, parseSnapshots } from './surveyComparison';
import { DEMO_MEASUREMENTS } from '../data/demoSurvey';

const reading = DEMO_MEASUREMENTS[0];
describe('survey comparisons', () => {
  it('reports signed dB change without depending on generated IDs or display names', () => {
    const result = compareSurveys([{ ...reading, signalDbm: -79 }], [{ ...reading, id: 'new', locationName: 'Renamed', signalDbm: -61 }]);
    assert.equal(result.average, 18);
    assert.equal(result.improved, 1);
  });
  it('keeps different access points, networks and positions separate', () => {
    for (const change of [{ bssid: '02:11:22:33:44:55' }, { ssid: 'Other' }, { x: 99 }, { zone: 'Parking Lot' as const }]) {
      const result = compareSurveys([reading], [{ ...reading, ...change }]);
      assert.equal(result.rows.length, 0);
      assert.equal(result.average, null);
      assert.equal(result.excludedBefore, 1);
      assert.equal(result.excludedAfter, 1);
    }
  });
  it('excludes duplicates on either side rather than arbitrarily pairing them', () => {
    assert.equal(compareSurveys([reading, reading], [reading]).rows.length, 0);
    assert.equal(compareSurveys([reading], [reading, reading]).rows.length, 0);
  });
  it('reports declines and unchanged readings and normalizes BSSID case', () => {
    const before = DEMO_MEASUREMENTS.slice(0, 2);
    const after = before.map((item, index) => ({ ...item, bssid: item.bssid.toLowerCase(), signalDbm: item.signalDbm - index * 10 }));
    const result = compareSurveys(before, after);
    assert.equal(result.declined, 1);
    assert.equal(result.unchanged, 1);
    assert.equal(result.average, -5);
  });
  it('rejects malformed or out-of-range stored history', () => {
    assert.deepEqual(parseSnapshots(null), []);
    assert.throws(() => parseSnapshots('{'));
    const snapshot = { id: 'one', name: 'Baseline', createdAt: new Date().toISOString(), measurements: [reading] };
    assert.equal(parseSnapshots(JSON.stringify([snapshot])).length, 1);
    assert.throws(() => parseSnapshots(JSON.stringify([{ ...snapshot, measurements: [{ ...reading, signalDbm: 100 }] }])));
  });
});
