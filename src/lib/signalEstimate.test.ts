import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Measurement } from '../types';
import { estimateSignalAt } from './signalEstimate';

function reading(overrides: Partial<Measurement>): Measurement {
  return {
    id: 'r',
    locationName: 'Reading',
    zone: 'Indoor',
    x: 0,
    y: 0,
    ssid: 'Net',
    bssid: '02:A1:B2:C3:D4:01',
    signalDbm: -60,
    ...overrides,
  };
}

describe('estimateSignalAt', () => {
  it('returns null when there are no readings', () => {
    assert.equal(estimateSignalAt({ x: 10, y: 10 }, []), null);
  });

  it('returns the reading value at an exact reading position', () => {
    const measurements = [reading({ id: 'a', x: 30, y: 40, signalDbm: -48 })];
    assert.equal(estimateSignalAt({ x: 30, y: 40 }, measurements)?.signalDbm, -48);
  });

  it('averages equally distant readings', () => {
    const measurements = [
      reading({ id: 'a', x: 0, y: 0, signalDbm: -50 }),
      reading({ id: 'b', x: 10, y: 0, signalDbm: -70 }),
    ];
    assert.ok(Math.abs((estimateSignalAt({ x: 5, y: 0 }, measurements)?.signalDbm ?? 0) + 60) < 1e-9);
  });

  it('leans toward the closer reading and reports it as nearest', () => {
    const measurements = [
      reading({ id: 'a', x: 0, y: 0, signalDbm: -50 }),
      reading({ id: 'b', x: 10, y: 0, signalDbm: -70 }),
    ];
    const estimate = estimateSignalAt({ x: 1, y: 0 }, measurements);
    assert.ok(estimate);
    assert.ok(estimate.signalDbm <= -50 && estimate.signalDbm > -55);
    assert.equal(estimate.nearest.id, 'a');
  });
});
