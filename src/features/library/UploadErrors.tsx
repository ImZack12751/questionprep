import { Icon } from '../../components/Icon';

export interface FileError {
  fileName: string;
  errors: string[];
}

export function UploadErrors({ items, onDismiss }: { items: FileError[]; onDismiss: () => void }) {
  if (!items.length) return null;
  return (
    <section className="upload-errors" role="alert" aria-label="Upload problems">
      <header>
        <h2>We couldn't add {items.length === 1 ? 'this file' : 'these files'}</h2>
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
      <p className="upload-errors-hint">Fix the file (or ask the AI to fix it, pasting these messages) and upload it again.</p>
    </section>
  );
}
