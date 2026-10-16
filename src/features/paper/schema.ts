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

const partBase = { label: requiredText, marks, text: requiredText };
const PartSchema = z.discriminatedUnion('type', [
  z.object({ ...partBase, ...mcqFields }),
  z.object({ ...partBase, ...typedFields }),
  z.object({ ...partBase, ...mathFields }),
  z.object({ ...partBase, ...fillBlankFields }).superRefine(checkBlanks),
]);

const questionBase = { id: requiredText, marks, text: requiredText };
const MultipartSchema = z
  .object({
    id: requiredText,
    type: z.literal('multipart'),
    // Optional: always recomputed as the sum of the parts.
    marks: z.number().optional(),
    text: z.string().default(''),
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
  });

export type Paper = z.output<typeof PaperSchema>;
export type Section = Paper['sections'][number];
export type Question = Section['questions'][number];
export type QuestionType = Question['type'];
export type MultipartQuestion = Extract<Question, { type: 'multipart' }>;
export type Part = MultipartQuestion['parts'][number];
export type AnswerType = (typeof ANSWER_TYPES)[number];
/** Anything that takes a single answer: a non-multipart question or a part. */
export type Answerable = Part | Exclude<Question, MultipartQuestion>;
