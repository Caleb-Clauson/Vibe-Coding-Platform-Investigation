import '../test/setupDom';
import { afterEach, beforeEach, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MeasurementProvider } from '../context/MeasurementContext';
import { DashboardSection, type WorkspaceSection } from './DashboardSection';
import { SNAPSHOT_KEY } from '../lib/surveyComparison';

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: window.localStorage });
  localStorage.clear();
});
afterEach(cleanup);

it('requires confirmation before clearing current readings and preserves snapshot storage', () => {
  let destination: WorkspaceSection | null = null;
  localStorage.setItem(SNAPSHOT_KEY, '[]');
  window.confirm = () => false;
  render(<MeasurementProvider><DashboardSection navigate={section => { destination = section; }} /></MeasurementProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Start a new survey' }));
  assert.equal(destination, null);
  assert.equal(JSON.parse(localStorage.getItem('signalsafe.measurements.v1')!).length, 1);
  window.confirm = () => true;
  fireEvent.click(screen.getByRole('button', { name: 'Start a new survey' }));
  assert.equal(destination, 'survey');
  assert.deepEqual(JSON.parse(localStorage.getItem('signalsafe.measurements.v1')!), []);
  assert.equal(localStorage.getItem(SNAPSHOT_KEY), '[]');
});

it('loads the fictional demo and takes users to Survey', () => {
  let destination: WorkspaceSection | null = null;
  window.confirm = () => true;
  render(<MeasurementProvider><DashboardSection navigate={section => { destination = section; }} /></MeasurementProvider>);
  fireEvent.click(screen.getByRole('button', { name: 'Explore fictional demo' }));
  assert.equal(destination, 'survey');
  assert.equal(JSON.parse(localStorage.getItem('signalsafe.measurements.v1')!).length, 10);
});
