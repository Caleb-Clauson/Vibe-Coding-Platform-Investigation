import { testDom } from '../test/setupDom';
import assert from 'node:assert/strict';
import { after, afterEach, beforeEach, describe, it, mock } from 'node:test';
import { act, cleanup, renderHook } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { APPROVED_ACCESS_POINTS, DEMO_MEASUREMENTS } from '../data/demoSurvey';
import type { MeasurementInput } from '../types';
import { MeasurementProvider, useMeasurements } from './MeasurementContext';

const STORAGE_KEY = 'signalsafe.measurements.v1';

function input(overrides: Partial<MeasurementInput> = {}): MeasurementInput {
  return {
    locationName: 'Test office', zone: 'Indoor', x: 10, y: 20,
    ssid: APPROVED_ACCESS_POINTS[0].ssid,
    bssid: APPROVED_ACCESS_POINTS[0].bssid,
    signalDbm: -80,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return <StrictMode><MeasurementProvider>{children}</MeasurementProvider></StrictMode>;
}

beforeEach(() => {
  testDom.window.localStorage.clear();
  testDom.window.localStorage.setItem(STORAGE_KEY, '[]');
});

afterEach(() => {
  cleanup();
  mock.restoreAll();
});

after(() => testDom.window.close());

describe('shared measurement findings', () => {
  it('derives findings from persisted measurements on initial load', () => {
    testDom.window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_MEASUREMENTS));
    const { result } = renderHook(useMeasurements, { wrapper });
    assert.equal(result.current.measurements.length, 10);
    assert.deepEqual(result.current.findings.map((finding) => finding.affectedMeasurementIds), [
      ['demo-04', 'demo-05'], ['demo-06', 'demo-07', 'demo-08'], ['demo-09', 'demo-10'],
    ]);
  });

  it('updates findings on add, edit across thresholds, and deletion', () => {
    const { result } = renderHook(useMeasurements, { wrapper });
    assert.equal(result.current.findings.length, 0);

    act(() => result.current.addMeasurement(input()));
    const id = result.current.measurements[0].id;
    assert.equal(result.current.findings[0].type, 'weak-indoor-signal');
    assert.deepEqual(result.current.findings[0].affectedMeasurementIds, [id]);

    act(() => result.current.updateMeasurement(id, input({ signalDbm: -70 })));
    assert.deepEqual(result.current.findings.map((finding) => finding.type), ['fair-indoor-signal']);
    act(() => result.current.updateMeasurement(id, input({ signalDbm: -67 })));
    assert.deepEqual(result.current.findings.map((finding) => finding.type), ['fair-indoor-signal']);
    act(() => result.current.updateMeasurement(id, input({ signalDbm: -66 })));
    assert.equal(result.current.findings.length, 0);

    act(() => result.current.updateMeasurement(id, input()));
    assert.equal(result.current.findings.length, 1);
    act(() => result.current.deleteMeasurement(id));
    assert.equal(result.current.measurements.length, 0);
    assert.equal(result.current.findings.length, 0);
  });

  it('rechecks location zone and inventory membership when a measurement changes', () => {
    const { result } = renderHook(useMeasurements, { wrapper });
    act(() => result.current.addMeasurement(input({ signalDbm: -50, zone: 'Parking Lot' })));
    const id = result.current.measurements[0].id;
    assert.equal(result.current.findings[0].type, 'possible-signal-leakage');

    act(() => result.current.updateMeasurement(id, input({ signalDbm: -50 })));
    assert.equal(result.current.findings.length, 0);
    act(() => result.current.updateMeasurement(id, input({ signalDbm: -50, bssid: '02:FF:EE:DD:CC:99' })));
    assert.deepEqual(result.current.findings.map((finding) => finding.type), ['unrecognized-access-point']);
    act(() => result.current.updateMeasurement(id, input({ signalDbm: -50 })));
    assert.equal(result.current.findings.length, 0);
  });

  it('replaces the survey and loads the demo repeatedly without accumulating findings', () => {
    const { result } = renderHook(useMeasurements, { wrapper });
    act(() => result.current.addMeasurement(input({ bssid: '02:FF:EE:DD:CC:98' })));
    const oldId = result.current.measurements[0].id;
    act(() => result.current.replaceMeasurements(DEMO_MEASUREMENTS));
    const expected = result.current.findings;
    assert.equal(expected.length, 3);
    assert.ok(expected.every((finding) => !finding.affectedMeasurementIds.includes(oldId)));
    act(() => result.current.replaceMeasurements([...DEMO_MEASUREMENTS]));
    assert.equal(result.current.measurements.length, 10);
    assert.deepEqual(result.current.findings, expected);
    act(() => result.current.replaceMeasurements([]));
    assert.equal(result.current.findings.length, 0);
  });

  it('keeps grouped findings accurate as affected measurements are removed', () => {
    const { result } = renderHook(useMeasurements, { wrapper });
    act(() => result.current.replaceMeasurements(DEMO_MEASUREMENTS));
    const weakId = result.current.findings[0].id;
    act(() => result.current.deleteMeasurement('demo-04'));
    assert.equal(result.current.findings[0].id, weakId);
    assert.deepEqual(result.current.findings[0].affectedMeasurementIds, ['demo-05']);
    act(() => result.current.deleteMeasurement('demo-05'));
    assert.ok(result.current.findings.every((finding) => finding.type !== 'weak-indoor-signal'));
    assert.equal(result.current.findings.length, 2);
  });

  it('persists measurements and recalculates findings when the provider is remounted', () => {
    const first = renderHook(useMeasurements, { wrapper });
    act(() => first.result.current.addMeasurement(input()));
    const expected = first.result.current.findings;
    const saved: unknown = JSON.parse(testDom.window.localStorage.getItem(STORAGE_KEY)!);
    assert.deepEqual(saved, first.result.current.measurements);
    first.unmount();
    const second = renderHook(useMeasurements, { wrapper });
    assert.deepEqual(second.result.current.findings, expected);
  });

  it('continues analyzing current data if browser saving is blocked', () => {
    const { result } = renderHook(useMeasurements, { wrapper });
    mock.method(testDom.window.Storage.prototype, 'setItem', () => { throw new Error('Storage blocked'); });
    act(() => result.current.addMeasurement(input()));
    assert.equal(result.current.storageError, true);
    assert.equal(result.current.findings[0].type, 'weak-indoor-signal');
    act(() => result.current.updateMeasurement(result.current.measurements[0].id, input({ signalDbm: -50 })));
    assert.equal(result.current.findings.length, 0);
  });
});
