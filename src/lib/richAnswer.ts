import DOMPurify from 'dompurify';

/** Formatting a student can apply to a written answer. */
const ALLOWED_TAGS = ['b', 'strong', 'i', 'em', 'u', 'sub', 'sup', 'ul', 'ol', 'li', 'br', 'p', 'div'];

// Unicode sub/superscript characters, so plain-text exports still read H₂O, x², Fe³⁺.
const SUB: Record<string, string> = {
  ...Object.fromEntries([...'0123456789'].map((d, i) => [d, String.fromCharCode(0x2080 + i)])),
  '+': '₊', '-': '₋', '−': '₋', '=': '₌', '(': '₍', ')': '₎',
  a: 'ₐ', e: 'ₑ', h: 'ₕ', k: 'ₖ', l: 'ₗ', m: 'ₘ', n: 'ₙ', o: 'ₒ', p: 'ₚ', s: 'ₛ', t: 'ₜ', x: 'ₓ',
};
const SUP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '−': '⁻', '=': '⁼', '(': '⁽', ')': '⁾', n: 'ⁿ', i: 'ⁱ',
};

/** "2" → "₂"; text with no Unicode equivalent falls back to _{…} / ^{…}. */
export function scriptToPlain(text: string, kind: 'sub' | 'sup'): string {
  if (!text) return '';
  const map = kind === 'sub' ? SUB : SUP;
  const chars = [...text];
  if (chars.every((c) => map[c])) return chars.map((c) => map[c]).join('');
  const mark = kind === 'sub' ? '_' : '^';
  return chars.length === 1 ? `${mark}${text}` : `${mark}{${text}}`;
}

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
    if (tag === 'SUB' || tag === 'SUP') {
      const kind = tag === 'SUB' ? 'sub' : 'sup';
      const inner = (node.textContent ?? '').replace(/\u00a0/g, ' ');
      out.push(mode === 'markdown' ? `<${kind}>${inner}</${kind}>` : scriptToPlain(inner, kind));
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
