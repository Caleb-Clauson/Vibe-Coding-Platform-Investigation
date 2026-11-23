import { it } from 'node:test';
import assert from 'node:assert/strict';
import { exportSurvey, importSurvey } from './surveyTransfer';
import { parseComparisonDraft } from './comparisonDraft';
import { DEMO_MEASUREMENTS } from '../data/demoSurvey';

it('round-trips measurements with new unique IDs, preserving measurement values', () => {
  const source = [DEMO_MEASUREMENTS[0], DEMO_MEASUREMENTS[0]];
  const restored = importSurvey(exportSurvey(source));
  assert.notEqual(restored[0].id, restored[1].id);
  assert.equal(restored[0].signalDbm, source[0].signalDbm);
  assert.equal(restored[0].bssid, source[0].bssid);
  assert.deepEqual(importSurvey(exportSurvey([])), []);
});

it('rejects wrong formats and invalid readings instead of accepting broken survey data', () => {
  assert.throws(() => importSurvey('{}'));
  assert.throws(() => importSurvey(exportSurvey([{ ...DEMO_MEASUREMENTS[0], x: 101 }])));
  assert.throws(() => importSurvey(exportSurvey([{ ...DEMO_MEASUREMENTS[0], signalDbm: 2 }])));
});

it('restores partial drafts without accepting a mismatched reading count', () => {
  const following = { id: 'baseline', name: 'Before', createdAt: new Date().toISOString(), measurements: DEMO_MEASUREMENTS.slice(0, 2) };
  const value = { name: 'Follow-up', following, signals: ['-51', ''] };
  assert.deepEqual(parseComparisonDraft(JSON.stringify(value)), value);
  assert.throws(() => parseComparisonDraft(JSON.stringify({ ...value, signals: ['-51'] })));
  assert.throws(() => parseComparisonDraft('{'));
});
