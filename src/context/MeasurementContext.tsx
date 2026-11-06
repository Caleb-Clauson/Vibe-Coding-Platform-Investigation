import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Measurement, MeasurementInput } from '../types';
import { loadMeasurements, saveMeasurements } from '../lib/measurementStorage';

interface MeasurementContextValue {
  measurements: Measurement[];
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

  useEffect(() => {
    setStorageError(!saveMeasurements(measurements));
  }, [measurements]);

  const value = useMemo<MeasurementContextValue>(
    () => ({
      measurements,
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
    [measurements, storageError],
  );

  return <MeasurementContext.Provider value={value}>{children}</MeasurementContext.Provider>;
}

export function useMeasurements(): MeasurementContextValue {
  const context = useContext(MeasurementContext);
  if (!context) throw new Error('useMeasurements must be used inside MeasurementProvider');
  return context;
}
