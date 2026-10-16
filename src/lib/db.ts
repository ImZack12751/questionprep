import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Attempt, PaperRecord } from '../features/attempt/types';

interface QuestionprepDB extends DBSchema {
  papers: { key: string; value: PaperRecord };
  attempts: { key: string; value: Attempt; indexes: { byPaper: string } };
  /** Desmos state per attempt, so the calculator survives a reload. */
  calculator: { key: string; value: CalculatorState };
}

export interface CalculatorState {
  attemptId: string;
  mode: 'graphing' | 'scientific';
  graphing?: unknown;
  scientific?: unknown;
}

let dbPromise: Promise<IDBPDatabase<QuestionprepDB>> | undefined;

function db() {
  dbPromise ??= openDB<QuestionprepDB>('questionprep', 1, {
    upgrade(d) {
      d.createObjectStore('papers', { keyPath: 'id' });
      d.createObjectStore('attempts', { keyPath: 'id' }).createIndex('byPaper', 'paperId');
      d.createObjectStore('calculator', { keyPath: 'attemptId' });
    },
  });
  return dbPromise;
}

export const newId = () => crypto.randomUUID();

export async function listPapers(): Promise<PaperRecord[]> {
  const all = await (await db()).getAll('papers');
  return all.sort((a, b) => b.addedAt - a.addedAt);
}
export async function getPaper(id: string) {
  return (await db()).get('papers', id);
}
export async function savePaper(rec: PaperRecord) {
  await (await db()).put('papers', rec);
}
export async function deletePaper(id: string) {
  const d = await db();
  const attempts = await d.getAllKeysFromIndex('attempts', 'byPaper', id);
  const tx = d.transaction(['papers', 'attempts', 'calculator'], 'readwrite');
  await Promise.all([
    tx.objectStore('papers').delete(id),
    ...attempts.flatMap((a) => [tx.objectStore('attempts').delete(a), tx.objectStore('calculator').delete(a)]),
    tx.done,
  ]);
}

export async function listAttempts(paperId?: string): Promise<Attempt[]> {
  const d = await db();
  const all = paperId ? await d.getAllFromIndex('attempts', 'byPaper', paperId) : await d.getAll('attempts');
  return all.sort((a, b) => b.startedAt - a.startedAt);
}
export async function getAttempt(id: string) {
  return (await db()).get('attempts', id);
}
export async function saveAttempt(a: Attempt) {
  await (await db()).put('attempts', a);
}

export async function getCalculatorState(attemptId: string) {
  return (await db()).get('calculator', attemptId);
}
export async function saveCalculatorState(s: CalculatorState) {
  await (await db()).put('calculator', s);
}
