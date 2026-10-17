/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the app from /questionprep/. Override with VITE_BASE
// (e.g. VITE_BASE=/ for Vercel or a custom domain).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_BASE || '/questionprep/',
    plugins: [react()],
    worker: { format: 'es' },
    // KaTeX and MathLive are large by nature; MathLive is already split into its own lazy chunk.
    build: { chunkSizeWarningLimit: 1000 },
    test: {
      environment: 'node',
      include: ['src/**/*.test.{ts,tsx}'],
    },
  };
});
