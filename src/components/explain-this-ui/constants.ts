import type { CategoryId, PerspectiveId, SeverityId } from './types';

export const PERSPECTIVES: Array<{ id: PerspectiveId; label: string }> = [
  { id: 'user', label: 'User' },
  { id: 'developer', label: 'Developer' },
  { id: 'accessibility', label: 'Accessibility' },
];

export const CATEGORIES: Array<{ id: CategoryId; label: string }> = [
  { id: 'ux', label: 'UX' },
  { id: 'visual', label: 'Visual' },
  { id: 'logic', label: 'Logic' },
  { id: 'accessibility', label: 'Accessibility' },
];

export const SEVERITIES: Array<{ id: SeverityId; label: string }> = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export const STORAGE_KEY = 'explain-this-ui:v1';
