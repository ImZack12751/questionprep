import { z } from 'zod';

export const ANSWER_TYPES = ['mcq', 'typed', 'math', 'fill_blank'] as const;
export const QUESTION_TYPES = [...ANSWER_TYPES, 'multipart'] as const;

const requiredText = z.string().trim().min(1, { error: 'must not be empty' });
const optionalText = z.string().optional();
const marks = z.number().positive({ error: 'must be greater than 0' });

const mcqFields = {
  type: z.literal('mcq'),
  options: z
    .array(requiredText)
    .min(2, { error: 'mcq needs at least 2 options' }),
  allowMultiple: z.boolean().default(false),
};
const typedFields = { type: z.literal('typed') };
const mathFields = { type: z.literal('math') };
const fillBlankFields = {
  type: z.literal('fill_blank'),
  blanks: z.number().int({ error: 'must be a whole number' }).min(1, { error: 'fill_blank needs at least 1 blank' }),
};

/** Every {{n}} placeholder in the text must line up with 1..blanks. */
function checkBlanks(q: { text: string; blanks: number }, ctx: z.RefinementCtx) {
  const found = new Set([...q.text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => Number(m[1])));
  for (let i = 1; i <= q.blanks; i++) {
    if (!found.has(i)) {
      ctx.addIssue({
        code: 'custom',
        path: ['text'],
        message: `fill_blank has blanks: ${q.blanks} but the text has no {{${i}}} placeholder`,
      });
    }
  }
  for (const n of found) {
    if (n < 1 || n > q.blanks) {
      ctx.addIssue({
        code: 'custom',
        path: ['text'],
        message: `the text uses {{${n}}} but blanks is ${q.blanks}`,
      });
    }
  }
}

/** Ids of the contexts (sources, case studies, data) a question refers to. */
const contextIds = z
  .array(z.string({ error: 'contextIds entries must be strings' }).trim().min(1, { error: 'contextIds entries must not be empty' }), {
    error: 'contextIds must be a list of context ids, e.g. ["sourceA"]',
  })
  .optional();

const partBase = {
  label: requiredText,
  marks,
  text: requiredText,
  // Parts inherit their question's contexts; they can't have their own.
  contextIds: z.undefined({ error: 'parts cannot have contextIds; put contextIds on the multipart question instead' }).optional(),
};
const PartSchema = z.discriminatedUnion('type', [
  z.object({ ...partBase, ...mcqFields }),
  z.object({ ...partBase, ...typedFields }),
  z.object({ ...partBase, ...mathFields }),
  z.object({ ...partBase, ...fillBlankFields }).superRefine(checkBlanks),
]);

const questionBase = { id: requiredText, marks, text: requiredText, contextIds };
const MultipartSchema = z
  .object({
    id: requiredText,
    type: z.literal('multipart'),
    // Optional: always recomputed as the sum of the parts.
    marks: z.number().optional(),
    text: z.string().default(''),
    contextIds,
    parts: z.array(PartSchema).min(1, { error: 'multipart needs at least 1 part' }),
  })
  .superRefine((q, ctx) => {
    const seen = new Set<string>();
    q.parts.forEach((p, i) => {
      if (seen.has(p.label)) {
        ctx.addIssue({ code: 'custom', path: ['parts', i, 'label'], message: `duplicate part label "${p.label}"` });
      }
      seen.add(p.label);
    });
  })
  .transform((q) => ({ ...q, marks: q.parts.reduce((sum, p) => sum + p.marks, 0) }));

const QuestionSchema = z.discriminatedUnion('type', [
  z.object({ ...questionBase, ...mcqFields }),
  z.object({ ...questionBase, ...typedFields }),
  z.object({ ...questionBase, ...mathFields }),
  z.object({ ...questionBase, ...fillBlankFields }).superRefine(checkBlanks),
  MultipartSchema,
]);

export const ContextSchema = z.object(
  {
    id: requiredText,
    label: requiredText,
    title: optionalText,
    text: requiredText,
  },
  { error: 'each context must be an object with "id", "label" and "text"' },
);

const SectionSchema = z.object({
  title: requiredText,
  instructions: optionalText,
  questions: z.array(QuestionSchema).min(1, { error: 'a section needs at least 1 question' }),
});

export const PaperSchema = z
  .object({
    title: requiredText,
    subject: optionalText,
    durationMinutes: z.number().positive({ error: 'must be greater than 0' }),
    instructions: optionalText,
    contexts: z.array(ContextSchema, { error: 'contexts must be a list of context objects' }).optional(),
    sections: z.array(SectionSchema).min(1, { error: 'a paper needs at least 1 section' }),
  })
  .superRefine((paper, ctx) => {
    const seen = new Map<string, string>();
    paper.sections.forEach((s, si) =>
      s.questions.forEach((q, qi) => {
        const where = `section ${si + 1}, question ${qi + 1}`;
        const prev = seen.get(q.id);
        if (prev) {
          ctx.addIssue({
            code: 'custom',
            path: ['sections', si, 'questions', qi, 'id'],
            message: `id "${q.id}" is already used by ${prev}; ids must be unique`,
          });
        } else seen.set(q.id, where);
      }),
    );

    const contexts = paper.contexts ?? [];
    const ids = new Set<string>();
    const labels = new Set<string>();
    contexts.forEach((c, i) => {
      if (ids.has(c.id)) {
        ctx.addIssue({ code: 'custom', path: ['contexts', i, 'id'], message: `context id "${c.id}" is used more than once; context ids must be unique` });
      }
      if (labels.has(c.label)) {
        ctx.addIssue({ code: 'custom', path: ['contexts', i, 'label'], message: `context label "${c.label}" is used more than once; labels must be unique` });
      }
      ids.add(c.id);
      labels.add(c.label);
    });
    paper.sections.forEach((s, si) =>
      s.questions.forEach((q, qi) =>
        q.contextIds?.forEach((id, k) => {
          if (!ids.has(id)) {
            const known = contexts.length ? ` Known context ids: ${contexts.map((c) => `"${c.id}"`).join(', ')}.` : ' The paper has no "contexts".';
            ctx.addIssue({
              code: 'custom',
              path: ['sections', si, 'questions', qi, 'contextIds', k],
              message: `contextIds refers to "${id}", which is not a context id.${known}`,
            });
          }
        }),
      ),
    );
  });

export type Paper = z.output<typeof PaperSchema>;
export type Context = z.output<typeof ContextSchema>;
export type Section = Paper['sections'][number];
export type Question = Section['questions'][number];
export type QuestionType = Question['type'];
export type MultipartQuestion = Extract<Question, { type: 'multipart' }>;
export type Part = MultipartQuestion['parts'][number];
export type AnswerType = (typeof ANSWER_TYPES)[number];
/** Anything that takes a single answer: a non-multipart question or a part. */
export type Answerable = Part | Exclude<Question, MultipartQuestion>;
