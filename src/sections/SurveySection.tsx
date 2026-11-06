import { useState } from 'react';
import { useMeasurements } from '../context/MeasurementContext';
import { DEMO_MEASUREMENTS, isDemoSurvey } from '../data/demoSurvey';
import { EMPTY_FORM_VALUES, toFormValues } from '../lib/validation';
import type { MeasurementInput } from '../types';
import { ApprovedAccessPoints } from '../survey/ApprovedAccessPoints';
import { MeasurementForm } from '../survey/MeasurementForm';
import { MeasurementList } from '../survey/MeasurementList';

export function SurveySection() {
  const {
    measurements,
    storageError,
    addMeasurement,
    updateMeasurement,
    deleteMeasurement,
    replaceMeasurements,
  } = useMeasurements();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  const editing = measurements.find((measurement) => measurement.id === editingId) ?? null;

  function resetForm(nextEditingId: string | null) {
    setEditingId(nextEditingId);
    setFormKey((key) => key + 1);
  }

  function handleSubmit(input: MeasurementInput) {
    if (editingId) {
      updateMeasurement(editingId, input);
      setNotice(`Updated "${input.locationName}".`);
    } else {
      addMeasurement(input);
      setNotice(`Added "${input.locationName}".`);
    }
    resetForm(null);
  }

  function handleEdit(id: string) {
    setNotice(null);
    resetForm(id);
  }

  function handleDelete(id: string) {
    const target = measurements.find((measurement) => measurement.id === id);
    if (!target) return;
    if (!window.confirm(`Delete the reading for "${target.locationName}"?`)) return;
    deleteMeasurement(id);
    if (editingId === id) resetForm(null);
    setNotice(`Deleted "${target.locationName}".`);
  }

  function handleLoadDemo() {
    if (!isDemoSurvey(measurements)) {
      const confirmed = window.confirm(
        'Replace the current readings with the fictional demo survey? Readings you added or edited will be replaced.',
      );
      if (!confirmed) return;
    }
    replaceMeasurements(DEMO_MEASUREMENTS);
    resetForm(null);
    setNotice(`Loaded the fictional demo survey with ${DEMO_MEASUREMENTS.length} readings.`);
  }

  return (
    <section className="section-stack" aria-labelledby="survey-heading">
      <header className="section-header">
        <div className="section-header-row">
          <div>
            <h2 id="survey-heading">Survey readings</h2>
            <p>Record the Wi-Fi signal measured at each location in your space.</p>
          </div>
          <button type="button" className="button button-secondary" onClick={handleLoadDemo}>
            Load Demo Survey
          </button>
        </div>
        <p>
          <span className="badge">Fictional demo data</span>{' '}
          <span className="section-note">
            Sample readings describe Maple Street Bakery, a fictional business.
          </span>
        </p>
      </header>

      {storageError && (
        <p className="alert alert-error" role="alert">
          This browser could not save your changes. They will be lost when the page is refreshed.
        </p>
      )}
      {notice && (
        <p className="alert alert-success" role="status">
          {notice}
        </p>
      )}

      <div className="survey-layout">
        <div className="survey-column">
          <div className="card">
            <h3>{editing ? 'Edit reading' : 'Add a reading'}</h3>
            <MeasurementForm
              key={formKey}
              mode={editing ? 'edit' : 'add'}
              initialValues={editing ? toFormValues(editing) : EMPTY_FORM_VALUES}
              onSubmit={handleSubmit}
              onCancel={editing ? () => resetForm(null) : undefined}
            />
          </div>
          <ApprovedAccessPoints />
        </div>

        <div className="card">
          <h3>Saved readings ({measurements.length})</h3>
          <MeasurementList
            measurements={measurements}
            editingId={editingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </section>
  );
}
