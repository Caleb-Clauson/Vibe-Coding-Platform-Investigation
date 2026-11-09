import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Measurement } from '../types';
import { buildHeatCells } from './heatmapGrid';

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

describe('buildHeatCells', () => {
  it('returns no cells when there are no readings', () => {
    assert.deepEqual(buildHeatCells([]), []);
  });

  it('covers the whole map with cell centers inside 0-100', () => {
    const cells = buildHeatCells([reading({ x: 50, y: 50 })]);
    assert.equal(cells.length, 2500);
    assert.ok(cells.every((cell) => cell.x > 0 && cell.x < 100 && cell.y > 0 && cell.y < 100));
  });

  it('shades cells between readings by their estimated signal', () => {
    const cells = buildHeatCells([
      reading({ id: 'good', x: 10, y: 50, signalDbm: -50 }),
      reading({ id: 'weak', x: 90, y: 50, signalDbm: -80 }),
    ]);
    const at = (x: number, y: number) => cells.find((cell) => cell.x === x && cell.y === y)!;
    assert.ok(at(11, 51).signalDbm > -60);
    assert.ok(at(89, 51).signalDbm < -70);
  });
});
