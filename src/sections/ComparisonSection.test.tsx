import '../test/setupDom';
import { afterEach, beforeEach, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MeasurementProvider } from '../context/MeasurementContext';
import { ComparisonSection } from './ComparisonSection';
import { DRAFT_KEY } from '../lib/comparisonDraft';
import { SNAPSHOT_KEY } from '../lib/surveyComparison';

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: window.localStorage });
  window.localStorage.clear();
});
afterEach(cleanup);

it('saves an immutable baseline, requires fresh readings, and persists a comparison', () => {
  render(<MeasurementProvider><ComparisonSection /></MeasurementProvider>);
  fireEvent.change(screen.getByLabelText('Survey name'), { target: { value: 'Before' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save current survey' }));
  fireEvent.click(screen.getByRole('button', { name: 'Record follow-up for Before' }));
  const input = screen.getByRole('spinbutton');
  assert.equal((input as HTMLInputElement).value, '');
  fireEvent.click(screen.getByRole('button', { name: 'Save and compare' }));
  assert.match(screen.getByRole('alert').textContent!, /every follow-up/);
  fireEvent.change(input, { target: { value: '-40' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save and compare' }));
  const saved = JSON.parse(localStorage.getItem(SNAPSHOT_KEY)!);
  assert.equal(saved.length, 2);
  assert.equal(saved[0].measurements[0].signalDbm, -58);
  assert.equal(saved[1].measurements[0].signalDbm, -40);
  assert.ok(screen.getAllByText('+18 dB · Stronger').length >= 1);
  cleanup();
  render(<MeasurementProvider><ComparisonSection /></MeasurementProvider>);
  assert.ok(screen.getAllByText('+18 dB · Stronger').length >= 1);
});

it('preserves unreadable saved history instead of silently replacing it', () => {
  localStorage.setItem(SNAPSHOT_KEY, 'broken history');
  render(<MeasurementProvider><ComparisonSection /></MeasurementProvider>);
  assert.match(screen.getByRole('alert').textContent!, /not been overwritten/);
  assert.equal((screen.getByRole('button', { name: 'Save current survey' }) as HTMLButtonElement).disabled, true);
  assert.equal(localStorage.getItem(SNAPSHOT_KEY), 'broken history');
});


it('recovers a partial follow-up after remount and clears the draft after saving', () => {
  render(<MeasurementProvider><ComparisonSection /></MeasurementProvider>);
  fireEvent.change(screen.getByLabelText('Survey name'), { target: { value: 'Before refresh' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save current survey' }));
  fireEvent.click(screen.getByRole('button', { name: 'Record follow-up for Before refresh' }));
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '-45' } });
  assert.ok(localStorage.getItem(DRAFT_KEY));
  cleanup();
  render(<MeasurementProvider><ComparisonSection /></MeasurementProvider>);
  assert.equal((screen.getByRole('spinbutton') as HTMLInputElement).value, '-45');
  assert.equal((screen.getByLabelText('Survey name') as HTMLInputElement).value, 'Before refresh — follow-up');
  fireEvent.click(screen.getByRole('button', { name: 'Save and compare' }));
  assert.equal(localStorage.getItem(DRAFT_KEY), null);
  assert.equal(JSON.parse(localStorage.getItem(SNAPSHOT_KEY)!).length, 2);
});
