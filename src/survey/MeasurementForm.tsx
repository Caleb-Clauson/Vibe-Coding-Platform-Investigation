import { useState, type FormEvent, type ReactNode } from 'react';
import { ZONES, type MeasurementInput } from '../types';
import {
  validateMeasurementForm,
  type MeasurementFormErrors,
  type MeasurementFormValues,
} from '../lib/validation';

interface MeasurementFormProps {
  mode: 'add' | 'edit';
  initialValues: MeasurementFormValues;
  onSubmit: (input: MeasurementInput) => void;
  onCancel?: () => void;
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

function Field({ id, label, hint, error, className, children }: FieldProps) {
  return (
    <div className={className ? `field ${className}` : 'field'}>
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function MeasurementForm({ mode, initialValues, onSubmit, onCancel }: MeasurementFormProps) {
  const [values, setValues] = useState<MeasurementFormValues>(initialValues);
  const [errors, setErrors] = useState<MeasurementFormErrors>({});

  const errorCount = Object.keys(errors).length;

  function updateField(field: keyof MeasurementFormValues, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateMeasurementForm(values);
    setErrors(result.errors);
    if (result.input) onSubmit(result.input);
  }

  return (
    <form className="measurement-form" onSubmit={handleSubmit} noValidate>
      {errorCount > 0 && (
        <p className="alert alert-error" role="alert">
          Please correct {errorCount} {errorCount === 1 ? 'field' : 'fields'} below.
        </p>
      )}

      <div className="form-grid">
        <Field id="locationName" label="Location name" hint="A short name, such as 'Front desk' or 'Storage room'." error={errors.locationName} className="field-full">
          <input
            id="locationName"
            className="input"
            type="text"
            maxLength={60}
            value={values.locationName}
            aria-invalid={Boolean(errors.locationName)}
            onChange={(event) => updateField('locationName', event.target.value)}
          />
        </Field>

        <Field id="zone" label="Zone" error={errors.zone}>
          <select
            id="zone"
            className="input"
            value={values.zone}
            aria-invalid={Boolean(errors.zone)}
            onChange={(event) => updateField('zone', event.target.value)}
          >
            {ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </Field>

        <Field id="signalDbm" label="Signal strength (dBm)" hint="Usually -30 (very strong) to -90 (very weak)." error={errors.signalDbm}>
          <input
            id="signalDbm"
            className="input"
            type="number"
            inputMode="numeric"
            step={1}
            placeholder="-55"
            value={values.signalDbm}
            aria-invalid={Boolean(errors.signalDbm)}
            onChange={(event) => updateField('signalDbm', event.target.value)}
          />
        </Field>

        <Field id="x" label="Horizontal position (0-100)" hint="0 is the left edge of the map, 100 is the right." error={errors.x}>
          <input
            id="x"
            className="input"
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            max={100}
            value={values.x}
            aria-invalid={Boolean(errors.x)}
            onChange={(event) => updateField('x', event.target.value)}
          />
        </Field>

        <Field id="y" label="Vertical position (0-100)" hint="0 is the top edge of the map, 100 is the bottom." error={errors.y}>
          <input
            id="y"
            className="input"
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            max={100}
            value={values.y}
            aria-invalid={Boolean(errors.y)}
            onChange={(event) => updateField('y', event.target.value)}
          />
        </Field>

        <Field id="ssid" label="Network name (SSID)" hint="The Wi-Fi name exactly as shown on your device." error={errors.ssid}>
          <input
            id="ssid"
            className="input"
            type="text"
            maxLength={32}
            value={values.ssid}
            aria-invalid={Boolean(errors.ssid)}
            onChange={(event) => updateField('ssid', event.target.value)}
          />
        </Field>

        <Field id="bssid" label="Access point ID (BSSID)" hint="Six pairs of characters, such as AA:BB:CC:DD:EE:FF." error={errors.bssid}>
          <input
            id="bssid"
            className="input"
            type="text"
            placeholder="AA:BB:CC:DD:EE:FF"
            value={values.bssid}
            aria-invalid={Boolean(errors.bssid)}
            onChange={(event) => updateField('bssid', event.target.value)}
          />
        </Field>
      </div>

      <div className="form-actions">
        {mode === 'edit' && onCancel && (
          <button type="button" className="button button-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="button button-primary">
          {mode === 'edit' ? 'Save changes' : 'Add reading'}
        </button>
      </div>
    </form>
  );
}
