import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Measurement, MeasurementInput, WiFiFinding } from '../types';
import { APPROVED_ACCESS_POINTS } from '../data/demoSurvey';
import { loadMeasurements, saveMeasurements } from '../lib/measurementStorage';
import { analyzeWifiMeasurements } from '../lib/wifiAnalysis';

interface MeasurementContextValue {
  measurements: Measurement[];
  findings: WiFiFinding[];
  storageError: boolean;
  addMeasurement: (input: MeasurementInput) => void;
  updateMeasurement: (id: string, input: MeasurementInput) => void;
  deleteMeasurement: (id: string) => void;
  replaceMeasurements: (next: Measurement[]) => void;
}

const MeasurementContext = createContext<MeasurementContextValue | null>(null);

function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function MeasurementProvider({ children }: { children: ReactNode }) {
  const [measurements, setMeasurements] = useState<Measurement[]>(loadMeasurements);
  const [storageError, setStorageError] = useState(false);
  const findings = useMemo(
    () => analyzeWifiMeasurements(measurements, APPROVED_ACCESS_POINTS),
    [measurements],
  );

  useEffect(() => {
    setStorageError(!saveMeasurements(measurements));
  }, [measurements]);

  const value = useMemo<MeasurementContextValue>(
    () => ({
      measurements,
      findings,
      storageError,
      addMeasurement: (input) =>
        setMeasurements((previous) => [...previous, { id: createId(), ...input }]),
      updateMeasurement: (id, input) =>
        setMeasurements((previous) =>
          previous.map((measurement) => (measurement.id === id ? { id, ...input } : measurement)),
        ),
      deleteMeasurement: (id) =>
        setMeasurements((previous) => previous.filter((measurement) => measurement.id !== id)),
      replaceMeasurements: (next) => setMeasurements(next),
    }),
    [measurements, findings, storageError],
  );

  return <MeasurementContext.Provider value={value}>{children}</MeasurementContext.Provider>;
}

export function useMeasurements(): MeasurementContextValue {
  const context = useContext(MeasurementContext);
  if (!context) throw new Error('useMeasurements must be used inside MeasurementProvider');
  return context;
}
