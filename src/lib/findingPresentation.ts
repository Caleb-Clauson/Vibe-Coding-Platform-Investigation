import type { FindingSeverity, WiFiFinding } from '../types';

export const SEVERITY_LABEL: Record<FindingSeverity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const SEVERITY_RANK: Record<FindingSeverity, number> = { high: 0, medium: 1, low: 2 };

export function sortFindingsBySeverity(findings: readonly WiFiFinding[]): WiFiFinding[] {
  return [...findings].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}
