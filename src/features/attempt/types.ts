import type { Paper } from '../paper/schema';

export type Answer =
  | { type: 'mcq'; selected: number[] }
  /** text is the plain-text version (used for exports); html keeps the student's formatting. */
  | { type: 'typed'; text: string; html?: string }
  | { type: 'math'; latex: string }
  | { type: 'fill_blank'; values: string[] };

export type AttemptStatus = 'in_progress' | 'submitted';

export interface Attempt {
  id: string;
  paperId: string;
  /** Snapshot of the paper as it was when the attempt started. */
  paper: Paper;
  status: AttemptStatus;
  startedAt: number;
  updatedAt: number;
  submittedAt?: number;
  autoSubmitted?: boolean;
  durationMs: number;
  /** Active exam time used so far; excludes paused time and time the tab was closed. */
  elapsedMs: number;
  answers: Record<string, Answer>;
  /** Keyed by question id. */
  flags: Record<string, boolean>;
  currentSection: number;
}

export interface PaperRecord {
  id: string;
  paper: Paper;
  addedAt: number;
  fileName?: string;
}
