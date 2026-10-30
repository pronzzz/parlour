/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Firebase and chess.js are only imported dynamically, so the landing page
// ships without them and they arrive the first time someone sits at a table.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: { target: 'es2022' },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
