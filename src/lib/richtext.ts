import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import { renderToString } from 'katex';

const marked = new Marked({ gfm: true, breaks: true, async: false });

const BLANK = (n: string) => `QPBLANK${n}QP`;
const MATH = (i: number) => `QPMATH${i}QP`;

interface MathChunk {
  tex: string;
  display: boolean;
}

/**
 * Pull LaTeX out before Markdown sees it (so `_` and `*` inside maths are not
 * treated as emphasis), then put KaTeX output back after sanitising.
 * Supports $$…$$, \[…\], $…$ and \(…\). Write \$ for a literal dollar sign.
 */
function extractMath(src: string): { text: string; chunks: MathChunk[] } {
  const chunks: MathChunk[] = [];
  const push = (tex: string, display: boolean) => {
    chunks.push({ tex: tex.trim(), display });
    return MATH(chunks.length - 1);
  };
  let text = src
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, t: string) => `\n\n${push(t, true)}\n\n`)
    .replace(/\\\[([\s\S]+?)\\\]/g, (_, t: string) => `\n\n${push(t, true)}\n\n`)
    .replace(/\\\(([\s\S]+?)\\\)/g, (_, t: string) => push(t, false))
    // Inline $…$: opening $ not escaped and not followed by space; closing $ not preceded by space.
    .replace(/(^|[^\\])\$(?=\S)((?:\\\$|[^$\n])+?)(?<=\S)\$/g, (_, pre: string, t: string) => pre + push(t, false));
  text = text.replace(/\\\$/g, '&#36;');
  return { text, chunks };
}

function renderTex({ tex, display }: MathChunk): string {
  return renderToString(tex, { displayMode: display, throwOnError: false, output: 'htmlAndMathml', strict: false });
}

export interface RichOptions {
  /** Render as inline content (no wrapping <p>), for options and short labels. */
  inline?: boolean;
  /** Turn {{n}} placeholders into <span data-blank="n"> slots. */
  blanks?: boolean;
}

const cache = new Map<string, string>();

export function renderRich(src: string, opts: RichOptions = {}): string {
  const cacheKey = `${opts.inline ? 'i' : 'b'}${opts.blanks ? 'f' : ''}:${src}`;
  const hit = cache.get(cacheKey);
  if (hit !== undefined) return hit;

  let { text, chunks } = extractMath(src);
  if (opts.blanks) text = text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n: string) => BLANK(n));

  const html = opts.inline ? (marked.parseInline(text) as string) : (marked.parse(text) as string);
  let safe = DOMPurify.sanitize(html, { ADD_ATTR: ['target'] });

  safe = safe
    // A display-maths token alone in a paragraph should not be wrapped in <p>.
    .replace(/<p>\s*QPMATH(\d+)QP\s*<\/p>/g, (_, i: string) => `<div class="math-block">${renderTex(chunks[Number(i)]!)}</div>`)
    .replace(/QPMATH(\d+)QP/g, (_, i: string) => {
      const c = chunks[Number(i)]!;
      return c.display ? `<span class="math-block">${renderTex(c)}</span>` : renderTex(c);
    });
  // Wide tables scroll sideways on small screens instead of squashing.
  safe = safe.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  if (opts.blanks) safe = safe.replace(/QPBLANK(\d+)QP/g, (_, n: string) => `<span class="blank-slot" data-blank="${n}"></span>`);

  if (cache.size > 2000) cache.clear();
  cache.set(cacheKey, safe);
  return safe;
}

/** Render a LaTeX answer (from MathLive) for display. */
export function renderLatex(tex: string, display = false): string {
  return renderTex({ tex, display });
}
