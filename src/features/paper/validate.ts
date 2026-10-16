import type { z } from 'zod';
import { PaperSchema, QUESTION_TYPES, ANSWER_TYPES, type Paper } from './schema';

export type ParseResult = { ok: true; paper: Paper } | { ok: false; errors: string[] };

const MAX_ERRORS = 12;

/** Parse and validate the contents of an uploaded paper file. */
export function parsePaperJson(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(stripCodeFence(text));
  } catch (e) {
    return {
      ok: false,
      errors: [`This file isn't valid JSON (${(e as Error).message}). Check for trailing commas or unescaped backslashes — LaTeX like \\frac must be written \\\\frac inside JSON strings.`],
    };
  }
  return validatePaper(raw);
}

export function validatePaper(raw: unknown): ParseResult {
  const result = PaperSchema.safeParse(raw);
  if (result.success) return { ok: true, paper: result.data };
  const messages = [...new Set(result.error.issues.map((i) => formatIssue(i, raw)))];
  if (messages.length > MAX_ERRORS) {
    const extra = messages.length - MAX_ERRORS;
    return { ok: false, errors: [...messages.slice(0, MAX_ERRORS), `…and ${extra} more problem${extra === 1 ? '' : 's'}.`] };
  }
  return { ok: false, errors: messages };
}

/** AI chats often wrap JSON in ```json fences; tolerate that. */
function stripCodeFence(text: string): string {
  const m = text.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return m ? m[1]! : text;
}

function get(obj: unknown, path: PropertyKey[]): unknown {
  let cur = obj;
  for (const key of path) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<PropertyKey, unknown>)[key];
  }
  return cur;
}

const list = (xs: readonly string[]) => xs.map((x) => `"${x}"`).join(', ');

function formatIssue(issue: z.core.$ZodIssue, raw: unknown): string {
  const path = issue.path;
  const where: string[] = [];
  let i = 0;
  let inPart = false;

  if (path[0] === 'sections' && typeof path[1] === 'number') {
    where.push(`Section ${path[1] + 1}`);
    i = 2;
    if (path[2] === 'questions' && typeof path[3] === 'number') {
      const q = get(raw, path.slice(0, 4)) as { id?: unknown } | undefined;
      const id = typeof q?.id === 'string' && q.id ? ` ("${q.id}")` : '';
      where.push(`question ${path[3] + 1}${id}`);
      i = 4;
      if (path[4] === 'parts' && typeof path[5] === 'number') {
        const p = get(raw, path.slice(0, 6)) as { label?: unknown } | undefined;
        where.push(typeof p?.label === 'string' && p.label ? `part (${p.label})` : `part ${path[5] + 1}`);
        i = 6;
        inPart = true;
      }
    }
  }
  const rest = path.slice(i);
  let field: PropertyKey | undefined = rest.find((k) => typeof k === 'string');
  if (typeof rest[0] === 'string' && typeof rest[1] === 'number') {
    // e.g. options[2]
    field = `${String(rest[0])} item ${rest[1] + 1}`;
  }

  const prefix = where.length ? `${where.join(', ')}: ` : 'Paper: ';
  const name = field !== undefined ? `"${String(field)}"` : '';
  const input = 'input' in issue ? issue.input : get(raw, path);

  switch (issue.code) {
    case 'invalid_union': {
      if ('discriminator' in issue && issue.discriminator === 'type') {
        const allowed = inPart ? ANSWER_TYPES : QUESTION_TYPES;
        const t = get(raw, path);
        return t === undefined
          ? `${prefix}"type" is missing — use one of ${list(allowed)}`
          : `${prefix}type "${String(t)}" isn't supported — use one of ${list(allowed)}`;
      }
      return `${prefix}${name || 'value'} is not in a recognised shape`;
    }
    case 'invalid_type': {
      if (input === undefined) return `${prefix}${name} is missing`;
      const expected = issue.expected === 'array' ? 'a list' : issue.expected === 'object' ? 'an object' : `a ${issue.expected}`;
      return `${prefix}${name || 'value'} should be ${expected}`;
    }
    case 'invalid_value':
      return `${prefix}${name} must be ${issue.values.map((v) => JSON.stringify(v)).join(' or ')}`;
    case 'too_small':
    case 'too_big':
    case 'custom':
    default: {
      const msg = issue.message;
      // Messages that already name the question type read fine on their own.
      if (/^(mcq|fill_blank|multipart|a section|a paper)\b/.test(msg) || issue.code === 'custom') return `${prefix}${msg}`;
      return `${prefix}${name ? `${name} ` : ''}${msg}`;
    }
  }
}
