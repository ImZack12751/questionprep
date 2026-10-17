# Questionprep

Questionprep is a quiet, timed exam room for question papers made by an AI. Ask Claude or ChatGPT for a paper as JSON, drop the file in, and sit it like a real exam: a countdown, sections as tabs, review flags, a pause button, maths input and a Desmos calculator. Afterwards you export your answers and paste them back into the AI to get them marked.

It runs entirely in the browser. There's no backend, no login and no grading. Papers and attempts are stored in IndexedDB on your device.

## Features

- **Library**: upload `.json` papers with the button or by dragging them anywhere on the page. Mistakes in a file are reported with their location, e.g. `Section 2, question 3 ("q4"): mcq needs at least 2 options`. There are two built-in samples and a **Copy AI prompt** button.
- **Exam**: countdown that turns amber under 5 minutes and red under 1, auto-submit at zero, a pause button that hides the paper, sections as tabs with answered/total counts, and flags for review.
- **Answer types**: multiple choice (single or multiple answers), free text with a formatting toolbar (bold, italic, underline, bulleted and numbered lists; Ctrl/⌘+B/I/U) and a spellchecker that accepts both British and American spelling, maths (MathLive with on-screen keyboard, several lines of working, stored as LaTeX), fill-in-the-blank (inline inputs) and multipart questions.
- **Calculator**: Desmos graphing and scientific calculators in a resizable drawer on the right edge. The calculator keeps its state while the drawer is closed and across reloads.
- **Autosave and resume**: every change is saved. The timer counts *active* exam time and checkpoints it every few seconds, so time while the tab is closed doesn't count. If the tab closes or the browser crashes, choose **Resume** on the paper's page.
- **Export**: JSON (for AI marking), Markdown, and PDF via the browser's print dialog, with maths rendered.
- Light and dark themes (follows the system until you choose one), and layouts that work down to tablet width.

## Setup

Requires Node.js 20+ (CI uses 22).

```bash
npm install
cp .env.example .env      # then add your Desmos key (see below)
npm run dev               # http://localhost:5173/questionprep/
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run build` | Type-checks and builds to `dist/` |
| `npm run preview` | Serves the production build locally |
| `npm test` | Unit and component tests (Vitest) |
| `npm run test:e2e` | Browser tests for the maths input and context cards (Playwright; run `npx playwright install chromium` once, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE`) |
| `npm run lint` | Oxlint, with TypeScript and React Hooks rules |
| `npm run typecheck` | TypeScript only |

### Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_DESMOS_API_KEY` | Desmos API key for the calculator drawer. |
| `VITE_BASE` | Path the site is served from. Defaults to `/questionprep/` (GitHub Pages). Use `/` for Vercel or a custom domain. |

If no key is set, `npm run dev` falls back to the public demo key from Desmos's documentation so you can try the calculator. A production build without a key shows "add your key" in the drawer; the rest of the app works normally.

## Getting a Desmos API key

1. Go to [desmos.com/my-api](https://www.desmos.com/my-api) and sign in to get a key. The [current Desmos API docs](https://www.desmos.com/api) send developers there for their own key. Keys start on a trial tier.
2. Put the key in `.env` as `VITE_DESMOS_API_KEY=...` for local builds. For GitHub Pages, add it as a repository secret (see Deploy below).
3. Check the [Desmos API Terms](https://www.desmos.com/api-terms) and their [plans for commercial use](https://help.desmos.com/hc/en-us/articles/49078363315725). Use beyond the trial limits, or any commercial use, needs a paid plan or an agreement through partnerships@desmos.com.

> **Note:** this is a static site, so the key is included in the JavaScript sent to the browser. Anyone who opens the deployed site can see it. The Desmos terms ask you to keep the key confidential, so keep the deployment for personal use and don't publicise the URL. To hide the key completely you'd need a server or proxy, which is outside this project's no-backend design.

The calculator script loads from `desmos.com`, so the calculator needs an internet connection. The rest of the app works offline once it has loaded.

## Paper JSON schema

```jsonc
{
  "title": string,
  "subject": string,              // optional
  "durationMinutes": number,      // > 0
  "instructions": string,         // optional
  "contexts": [ Context ],        // optional: shared sources, case studies, data tables
  "sections": [                   // at least 1
    {
      "title": string,
      "instructions": string,     // optional
      "questions": [ Question ]   // at least 1
    }
  ]
}
```

`Question` is one of:

| `type` | Fields | Notes |
| --- | --- | --- |
| `mcq` | `id`, `marks`, `text`, `options: string[]`, `allowMultiple?: boolean` | at least 2 options; `allowMultiple` defaults to `false` (radio buttons) |
| `typed` | `id`, `marks`, `text` | free-text answer |
| `math` | `id`, `marks`, `text` | answer entered with MathLive, one field per line of working, stored as LaTeX |
| `fill_blank` | `id`, `marks`, `text`, `blanks: number` | `text` must contain `{{1}}` … `{{blanks}}`; each becomes an inline input |
| `multipart` | `id`, `text`, `parts: Part[]` | `marks` is optional and always recalculated as the sum of the parts |

Every question type also accepts an optional `"contextIds": string[]`: the ids of the contexts it uses, in display order. On a `multipart` question it goes on the question itself and all parts inherit it; parts can't have their own.

`Context` is `{ "id": string, "label": string, "title"?: string, "text": string }`. Each context appears as its own card directly above every question that lists it, with the label (e.g. "Source A") as a heading, the optional title under it, and the text below. Context text supports the same Markdown and LaTeX as question text, including tables. Images aren't supported.

`Part` is `{ "label": "a", "type": "mcq" | "typed" | "math" | "fill_blank", "marks", "text", "options"?, "allowMultiple"?, "blanks"? }`, following the same per-type rules as above.

Validation rules:

- Question `id`s must be unique across the whole paper, and part labels must be unique within a question.
- Every text field supports **Markdown** and **LaTeX**: `$…$` (or `\(…\)`) inline, `$$…$$` (or `\[…\]`) display. Write `\$` for a literal dollar sign.
- In JSON, backslashes must be doubled: `"\\frac{1}{2}"`.
- Context ids and labels must be unique, and every `contextIds` entry must match a context id. A context that no question uses is accepted with a warning (it would never be shown).
- Unknown extra fields (e.g. an `answer` key added by the AI) are ignored.
- A file wrapped in a Markdown code fence (` ```json … ``` `) is accepted.

See [`samples/`](samples/) for three complete papers. `individuals-societies-sources.json` shows contexts: Source A is shared by three consecutive questions, and Source B is a data table.

### How shared contexts are shown

When consecutive questions use the same context, the card is expanded above the first one and collapsed above the rest. A collapsed card still shows its label and title, plus "Show (also used by question N)", so it's one click away. On the results page the same rule applies. In the PDF every card is printed in full. The Markdown export prints a source in full once per run and writes "(as above)" after that. The JSON export includes `contexts` and each question's `contextIds`, so an AI marker can see the sources.

## AI prompt template

The **Copy AI prompt** button copies this text (source: [`src/features/library/ai-prompt.md`](src/features/library/ai-prompt.md)). Fill in the bracketed lines, paste it into Claude or ChatGPT, save the reply as a `.json` file and upload it.

````text
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
````

## Exported JSON

The JSON export is designed to be pasted straight into an AI for marking. It includes a `markingNote`, paper details (with `totalMarks`), timing (`timeTakenSeconds`, `autoSubmittedWhenTimeRanOut`), counts, and every question with its `id`, `number`, `type`, `marks`, `text`, `options`, `flagged` and the student's `answer`:

- `mcq`: the chosen option as `"B. text"` (an array when `allowMultiple`)
- `typed`: plain text. Formatting is left out of the JSON (lists stay as `- ` / `1. ` lines), but it's kept on the results page, in the PDF and in the Markdown export
- `math`: a LaTeX string, with one line of working per line (separated by `\n`)
- `fill_blank`: one string per blank
- `contexts` (top level) and `contextIds` (per question) when the paper has sources
- `null` when unanswered; multipart questions have a `parts` array with an `answer` for each part

Only total time is recorded, not time per question.

## Deploying to GitHub Pages

The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) runs the tests, builds and deploys on every push to `main`.

1. Push the repository to GitHub with the default branch named `main`.
2. **Settings → Pages → Build and deployment → Source:** choose **GitHub Actions**.
3. **Settings → Secrets and variables → Actions → New repository secret:** name it `VITE_DESMOS_API_KEY` and paste your key.
4. Push to `main`, or run the workflow from the **Actions** tab. The site appears at `https://<user>.github.io/<repo>/`.

The workflow sets `VITE_BASE` to `/<repo-name>/`, so renaming the repository still works. Navigation uses hash routes (`#/paper/…`), so deep links and refreshes work on Pages without a 404 fallback.

### Vercel

Import the repository, keep the Vite preset, and set the environment variables `VITE_BASE=/` and `VITE_DESMOS_API_KEY=<key>`.

## Project structure

```
src/
  components/          shared UI (Rich text renderer, Dialog, Icon, Toast, ThemeToggle)
  lib/                 IndexedDB (idb), hash router, theme, Markdown+KaTeX rendering, formatting
  features/
    paper/             Zod schema, types and friendly validation messages
    library/           home screen, upload/drag-and-drop, samples, AI prompt
    start/             paper start screen and attempt history
    exam/              exam session, timer, autosave, section tabs, question inputs
    calculator/        Desmos loader and drawer
    results/           summary and answer review (also the print layout)
    export/            JSON and Markdown builders
  styles/              CSS with design tokens, one file per area, plus print.css
samples/               example papers (also bundled for the "Load sample" button)
```

## Maths answers

Maths answers can have several lines of working. Each line is its own MathLive field:

- **Enter** (or the on-screen keyboard's return key, or **+ New line**) starts a new line.
- **↑ / ↓** move between lines, and **Backspace** on an empty line removes it.
- **Text** switches the current line to plain words, so that "integral" isn't turned into ∫.
- The space bar inserts a thin space.

Answers are saved as `{ "type": "math", "latex": "line1 \\\\ line2", "lines": ["line1", "line2"] }`. Answers saved before multi-line support have only `latex` and load as a single line.

## Spellchecking

Written answers use Questionprep's own spellchecker, not the browser's, so British and American spellings (colour/color, organise/organize, centre/center) are both accepted. Only words that are wrong in both are underlined. Words that appear in the paper itself, acronyms (DNA) and formulas (NaCl, pH) are never flagged. The checker runs in a background worker using the US and UK English Hunspell dictionaries from [wooorm/dictionaries](https://github.com/wooorm/dictionaries) (MIT/BSD; licences are copied next to the dictionary files). `npm run dev` and `npm run build` copy the dictionaries into `public/dictionaries/` automatically. Browsers without the CSS Custom Highlight API fall back to the built-in spellchecker.

Built with Vite, React, TypeScript, Zod, MathLive, KaTeX, marked, DOMPurify, nspell and idb.
