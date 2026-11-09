import type { Measurement } from '../types';
import { estimateSignalAt } from './signalEstimate';

export interface HeatCell {
  x: number;
  y: number;
  signalDbm: number;
}

export const HEAT_CELL_STEP = 2;

export function buildHeatCells(
  measurements: readonly Measurement[],
  step: number = HEAT_CELL_STEP,
): HeatCell[] {
  const cells: HeatCell[] = [];
  for (let y = step / 2; y < 100; y += step) {
    for (let x = step / 2; x < 100; x += step) {
      const estimate = estimateSignalAt({ x, y }, measurements);
      if (estimate) cells.push({ x, y, signalDbm: estimate.signalDbm });
    }
  }
  return cells;
}
