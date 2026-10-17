export type FormatCommand = 'bold' | 'italic' | 'underline' | 'insertUnorderedList' | 'insertOrderedList';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const mod = isMac ? '⌘' : 'Ctrl+';

const BUTTONS: { cmd: FormatCommand; label: string; title: string; glyph: React.ReactNode }[] = [
  { cmd: 'bold', label: 'Bold', title: `Bold (${mod}B)`, glyph: <b>B</b> },
  { cmd: 'italic', label: 'Italic', title: `Italic (${mod}I)`, glyph: <i>I</i> },
  { cmd: 'underline', label: 'Underline', title: `Underline (${mod}U)`, glyph: <u>U</u> },
  {
    cmd: 'insertUnorderedList',
    label: 'Bulleted list',
    title: 'Bulleted list',
    glyph: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M9 6h11M9 12h11M9 18h11" />
        <circle cx="4.5" cy="6" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="18" r="1.2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    cmd: 'insertOrderedList',
    label: 'Numbered list',
    title: 'Numbered list',
    glyph: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d="M10 6h10M10 12h10M10 18h10" />
        <text x="2" y="8.5" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text>
        <text x="2" y="14.5" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text>
        <text x="2" y="20.5" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text>
      </svg>
    ),
  },
];

export function FormatToolbar({ active, onCommand }: { active: Set<FormatCommand>; onCommand: (c: FormatCommand) => void }) {
  return (
    <div className="format-toolbar" role="toolbar" aria-label="Text formatting">
      {BUTTONS.map((b, i) => (
        <span key={b.cmd} className="format-group">
          {i === 3 && <span className="format-sep" aria-hidden />}
          <button
            type="button"
            className={`format-btn ${active.has(b.cmd) ? 'is-on' : ''}`}
            aria-label={b.label}
            aria-pressed={active.has(b.cmd)}
            title={b.title}
            // Keep the text selection in the editor when clicking.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand(b.cmd)}
          >
            {b.glyph}
          </button>
        </span>
      ))}
    </div>
  );
}
