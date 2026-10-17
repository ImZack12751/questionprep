import DOMPurify from 'dompurify';

/** Formatting a student can apply to a written answer. */
const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'br', 'p', 'div'];

export function sanitizeAnswerHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR: [] });
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** For answers saved before formatting existed (plain text only). */
export function plainToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

type Mode = 'plain' | 'markdown';

const BLOCK = new Set(['P', 'DIV', 'UL', 'OL', 'LI']);

function convert(html: string, mode: Mode): string {
  const root = document.createElement('div');
  root.innerHTML = sanitizeAnswerHtml(html);
  const out: string[] = [];
  const newline = () => {
    if (out.length && !out.join('').endsWith('\n')) out.push('\n');
  };

  const walk = (node: Node, listDepth: number) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out.push((node.textContent ?? '').replace(/ /g, ' '));
      return;
    }
    if (!(node instanceof Element)) return;
    const tag = node.tagName;
    if (tag === 'BR') {
      out.push('\n');
      return;
    }
    if (tag === 'UL' || tag === 'OL') {
      newline();
      let n = 0;
      for (const child of node.children) {
        if (child.tagName !== 'LI') continue;
        n++;
        newline();
        out.push(`${'  '.repeat(listDepth)}${tag === 'OL' ? `${n}. ` : '- '}`);
        child.childNodes.forEach((c) => walk(c, listDepth + 1));
        newline();
      }
      return;
    }
    if (BLOCK.has(tag)) newline();
    const wrap = mode === 'markdown' ? (tag === 'B' || tag === 'STRONG' ? '**' : tag === 'I' || tag === 'EM' ? '*' : '') : '';
    const text = node.textContent ?? '';
    const [open, close] =
      mode === 'markdown' && tag === 'U' ? ['<u>', '</u>'] : wrap && text.trim() ? [wrap, wrap] : ['', ''];
    if (open) out.push(open);
    node.childNodes.forEach((c) => walk(c, listDepth));
    if (close) out.push(close);
    if (BLOCK.has(tag)) newline();
  };

  root.childNodes.forEach((c) => walk(c, 0));
  return out
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Plain text with list markers kept ("- " / "1. "), formatting dropped. Used for AI exports. */
export const htmlToPlainText = (html: string) => convert(html, 'plain');

/** Markdown version (**bold**, *italic*, <u>underline</u>, lists) for the Markdown export. */
export const htmlToMarkdown = (html: string) => convert(html, 'markdown');
