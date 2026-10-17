You are writing an exam question paper for a practice app called Questionprep. Output ONLY a single JSON object (no commentary, no code fences) that matches the schema below exactly.

TOPIC / LEVEL: [describe the subject, syllabus, level and topics here]
LENGTH: [e.g. 45 minutes, about 40 marks, 2–3 sections]

SCHEMA
{
  "title": string,
  "subject": string,                     // optional
  "durationMinutes": number,
  "instructions": string,                // optional, shown before the exam starts
  "contexts": [ Context, ... ],          // optional: shared sources / case studies / data tables
  "sections": [
    {
      "title": string,
      "instructions": string,            // optional
      "questions": [ Question, ... ]     // at least 1
    }
  ]
}

Context = { "id": string, "label": string, "title": string (optional), "text": string }
      - background material shown in its own card above the questions that use it, e.g. label "Source A".
      - id and label must each be unique among contexts.

Every Question (any type) may also have "contextIds": string[] listing the context ids it uses, in display order.

Question is one of:
  { "id": string, "type": "mcq", "marks": number, "text": string, "options": string[], "allowMultiple": boolean }
      - at least 2 options; allowMultiple is optional (default false). Do NOT mark the correct option.
  { "id": string, "type": "typed", "marks": number, "text": string }
      - free-text written answer.
  { "id": string, "type": "math", "marks": number, "text": string }
      - the student answers with a maths expression (entered as LaTeX).
  { "id": string, "type": "fill_blank", "marks": number, "text": string, "blanks": number }
      - text must contain the placeholders {{1}}, {{2}}, … up to {{blanks}}, each exactly once.
  { "id": string, "type": "multipart", "text": string, "parts": Part[] }
      - text is the shared stem. Do not give marks; they are the sum of the parts.
      - Part = { "label": "a", "type": "mcq" | "typed" | "math" | "fill_blank", "marks": number, "text": string, "options"?: string[], "allowMultiple"?: boolean, "blanks"?: number }
      - contextIds go on the multipart question itself; all parts inherit them. Parts must not have contextIds.

RULES
- Every question id must be unique across the whole paper (e.g. "1", "2", "3a" or "A1", "B2").
- All text fields support Markdown plus LaTeX: $...$ for inline maths, $$...$$ for display maths.
- This is JSON, so every backslash in LaTeX must be doubled: write "\\frac{1}{2}", not "\frac{1}{2}".
- Do not include answers, mark schemes or diagrams.
- Every contextIds entry must match the id of a context in "contexts", and every context must be used by at least one question.
- Context text supports Markdown plus LaTeX, text and tables only, no images.
- Questions should name the context by its label ("Using Source A, ...").
- Do not paste the same stimulus into several questions; define it once as a context.
- Omit "contexts" entirely if there is no shared background.
- Make the paper realistic for the level, with marks that reflect the work required.

SHORT EXAMPLE (no contexts)
{
  "title": "Algebra Check",
  "subject": "Mathematics",
  "durationMinutes": 20,
  "instructions": "Answer all questions.",
  "sections": [
    {
      "title": "Section A",
      "questions": [
        { "id": "1", "type": "mcq", "marks": 1, "text": "What is $2^3$?", "options": ["6", "8", "9"] },
        { "id": "2", "type": "math", "marks": 2, "text": "Simplify $\\frac{6x^2}{3x}$." },
        { "id": "3", "type": "fill_blank", "marks": 2, "blanks": 2, "text": "A triangle has {{1}} sides and its angles sum to {{2}} degrees." },
        { "id": "4", "type": "multipart", "text": "A line passes through $(0, 1)$ and $(2, 5)$.",
          "parts": [
            { "label": "a", "type": "math", "marks": 2, "text": "Find its gradient." },
            { "label": "b", "type": "typed", "marks": 1, "text": "Describe what the gradient tells you." }
          ] }
      ]
    }
  ]
}

SHORT EXAMPLE WITH A CONTEXT
{
  "title": "Population Change",
  "subject": "Geography",
  "durationMinutes": 15,
  "contexts": [
    { "id": "sourceA", "label": "Source A", "title": "Town population",
      "text": "| Year | Population |\n|---|---:|\n| 2000 | 8 000 |\n| 2020 | 12 000 |" }
  ],
  "sections": [
    {
      "title": "Section A",
      "questions": [
        { "id": "1", "type": "math", "marks": 2, "contextIds": ["sourceA"], "text": "Using Source A, calculate the percentage increase in population from 2000 to 2020." },
        { "id": "2", "type": "typed", "marks": 3, "contextIds": ["sourceA"], "text": "Using Source A, suggest **two** reasons for the change." }
      ]
    }
  ]
}
