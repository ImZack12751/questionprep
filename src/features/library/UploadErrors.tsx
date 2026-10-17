import { Icon } from '../../components/Icon';

export interface FileError {
  fileName: string;
  errors: string[];
}

interface Props {
  items: FileError[];
  onDismiss: () => void;
  /** Warnings: the paper was added, but something in it looks off. */
  tone?: 'error' | 'warning';
}

export function UploadErrors({ items, onDismiss, tone = 'error' }: Props) {
  if (!items.length) return null;
  const warning = tone === 'warning';
  return (
    <section
      className={`upload-errors ${warning ? 'is-warning' : ''}`}
      role={warning ? 'status' : 'alert'}
      aria-label={warning ? 'Upload warnings' : 'Upload problems'}
    >
      <header>
        <h2>{warning ? 'Added, with warnings' : `We couldn't add ${items.length === 1 ? 'this file' : 'these files'}`}</h2>
        <button type="button" className="btn btn-icon btn-ghost" onClick={onDismiss} aria-label="Dismiss">
          <Icon name="close" />
        </button>
      </header>
      {items.map((f) => (
        <div key={f.fileName} className="upload-error-file">
          <p className="upload-error-name">{f.fileName}</p>
          <ul>
            {f.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      ))}
      {!warning && <p className="upload-errors-hint">Fix the file (or ask the AI to fix it, pasting these messages) and upload it again.</p>}
    </section>
  );
}
