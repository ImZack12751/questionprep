import { useCallback, useEffect, useState } from 'react';
import { deletePaper, listAttempts, listPapers, newId, savePaper } from '../../lib/db';
import type { Attempt, PaperRecord } from '../attempt/types';
import type { Paper } from '../paper/schema';

export interface LibraryEntry {
  record: PaperRecord;
  attempts: Attempt[];
}

export function useLibrary() {
  const [entries, setEntries] = useState<LibraryEntry[] | null>(null);

  const refresh = useCallback(async () => {
    const [papers, attempts] = await Promise.all([listPapers(), listAttempts()]);
    setEntries(papers.map((record) => ({ record, attempts: attempts.filter((a) => a.paperId === record.id) })));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Adds a paper unless an identical one is already saved. Returns false for duplicates. */
  const add = useCallback(
    async (paper: Paper, fileName?: string) => {
      const json = JSON.stringify(paper);
      const existing = await listPapers();
      if (existing.some((p) => JSON.stringify(p.paper) === json)) return false;
      await savePaper({ id: newId(), paper, addedAt: Date.now(), fileName });
      await refresh();
      return true;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deletePaper(id);
      await refresh();
    },
    [refresh],
  );

  return { entries, add, remove };
}
