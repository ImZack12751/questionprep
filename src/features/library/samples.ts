import maths from '../../../samples/maths-calculus-algebra.json';
import mixed from '../../../samples/mixed-science-english.json';
import sources from '../../../samples/individuals-societies-sources.json';

export const SAMPLES: { name: string; description: string; data: unknown }[] = [
  { name: 'Pure Mathematics — Practice Paper 1', description: 'Maths answers, multipart, 45 min', data: maths },
  { name: 'Science & English mock', description: 'MCQ, typed and fill-in-the-blank, 30 min', data: mixed },
  { name: 'Urbanisation source paper', description: 'Individuals & Societies with Sources A and B, 40 min', data: sources },
];
