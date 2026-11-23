import { parseSnapshots, type SurveySnapshot } from './surveyComparison';

export const DRAFT_KEY = 'signalsafe.comparison-draft.v1';
export interface ComparisonDraft {
  name: string;
  following: SurveySnapshot | null;
  signals: string[];
}

export function parseComparisonDraft(raw: string | null): ComparisonDraft {
  if (!raw) return { name: '', following: null, signals: [] };
  const value = JSON.parse(raw);
  if (!value || typeof value.name !== 'string' || !Array.isArray(value.signals) ||
      !value.signals.every((signal: unknown) => typeof signal === 'string')) throw new Error('Invalid draft');
  const following = value.following === null ? null : parseSnapshots(JSON.stringify([value.following]))[0];
  if (following && value.signals.length !== following.measurements.length) throw new Error('Invalid draft');
  return { name: value.name, following, signals: value.signals };
}
