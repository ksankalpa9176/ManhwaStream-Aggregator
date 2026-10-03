import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const REPO_NAME = 'manhwa-stream';

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  build: { outDir: 'dist', sourcemap: false },
  server: { port: 3000, host: '0.0.0.0' },
}));
