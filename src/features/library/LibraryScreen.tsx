import { useRef, useState } from 'react';
import { BrandMark } from '../../components/BrandMark';
import { Dialog } from '../../components/Dialog';
import { Icon } from '../../components/Icon';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useToast } from '../../components/Toast';
import { copyText } from '../../lib/clipboard';
import { validatePaper, parsePaperJson } from '../paper/validate';
import AI_PROMPT from './ai-prompt.md?raw';
import { PaperCard } from './PaperCard';
import { SampleMenu } from './SampleMenu';
import { UploadErrors, type FileError } from './UploadErrors';
import { useFileDrop } from './useFileDrop';
import { useLibrary, type LibraryEntry } from './useLibrary';

export function LibraryScreen() {
  const { entries, add, remove } = useLibrary();
  const toast = useToast();
  const [errors, setErrors] = useState<FileError[]>([]);
  const [pendingDelete, setPendingDelete] = useState<LibraryEntry | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFiles(files: File[]) {
    const problems: FileError[] = [];
    const added: string[] = [];
    for (const file of files) {
      if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
        problems.push({ fileName: file.name, errors: ['Only .json files can be uploaded.'] });
        continue;
      }
      const result = parsePaperJson(await file.text());
      if (!result.ok) {
        problems.push({ fileName: file.name, errors: result.errors });
        continue;
      }
      if (await add(result.paper, file.name)) added.push(result.paper.title);
      else toast(`“${result.paper.title}” is already in your library`);
    }
    setErrors(problems);
    if (added.length === 1) toast(`Added “${added[0]}”`);
    else if (added.length > 1) toast(`Added ${added.length} papers`);
  }

  const dragging = useFileDrop((files) => void handleFiles(files));

  async function loadSample(data: unknown, name: string) {
    const r = validatePaper(data);
    if (!r.ok) return toast('Sample failed to load');
    toast((await add(r.paper, `${name} (sample)`)) ? `Added “${r.paper.title}”` : 'That sample is already in your library');
  }

  async function copyPrompt() {
    toast((await copyText(AI_PROMPT)) ? 'Prompt copied — paste it into Claude or ChatGPT' : 'Copy failed; see the README for the prompt');
  }

  return (
    <div className="page library">
      <header className="site-header">
        <BrandMark />
        <ThemeToggle />
      </header>

      <main className="library-main">
        <section className="library-hero">
          <div>
            <p className="eyebrow">Your exam room</p>
            <h1>Sit the paper. Under the clock.</h1>
            <p className="lede">
              Generate a question paper with an AI, drop the JSON here, and practise it in a quiet, timed exam sheet. Everything stays in this
              browser.
            </p>
          </div>
          <div className="library-actions">
            <button type="button" className="btn btn-primary" onClick={() => fileInput.current?.click()}>
              <Icon name="upload" /> Upload paper
            </button>
            <button type="button" className="btn btn-ghost" onClick={copyPrompt}>
              <Icon name="sparkle" /> Copy AI prompt
            </button>
            <SampleMenu onPick={loadSample} />
            <input
              ref={fileInput}
              type="file"
              accept=".json,application/json"
              multiple
              hidden
              onChange={(e) => {
                void handleFiles([...(e.target.files ?? [])]);
                e.target.value = '';
              }}
            />
          </div>
        </section>

        <UploadErrors items={errors} onDismiss={() => setErrors([])} />

        {entries === null ? null : entries.length === 0 ? (
          <button type="button" className="empty-drop" onClick={() => fileInput.current?.click()}>
            <Icon name="upload" size={28} />
            <strong>Drop a paper's .json file anywhere on this page</strong>
            <span>or click to choose a file. No paper yet? Load a sample, or copy the AI prompt to generate one.</span>
          </button>
        ) : (
          <section aria-label="Saved papers">
            <h2 className="section-label">
              Library <span>{entries.length}</span>
            </h2>
            <div className="paper-grid">
              {entries.map((e) => (
                <PaperCard key={e.record.id} entry={e} onDelete={() => setPendingDelete(e)} />
              ))}
            </div>
          </section>
        )}
      </main>

      {dragging && (
        <div className="drop-overlay" aria-hidden>
          <div>
            <Icon name="upload" size={36} />
            <p>Drop to add to your library</p>
          </div>
        </div>
      )}

      <Dialog
        open={!!pendingDelete}
        tone="danger"
        title="Delete this paper?"
        onClose={() => setPendingDelete(null)}
        actions={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setPendingDelete(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                const e = pendingDelete!;
                setPendingDelete(null);
                await remove(e.record.id);
                toast(`Deleted “${e.record.paper.title}”`);
              }}
            >
              Delete
            </button>
          </>
        }
      >
        <p>
          “{pendingDelete?.record.paper.title}” and its {pendingDelete?.attempts.length ?? 0} attempt(s) will be removed from this browser. Export
          anything you want to keep first.
        </p>
      </Dialog>
    </div>
  );
}
