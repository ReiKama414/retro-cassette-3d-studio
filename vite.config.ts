import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoBase = '/retro-cassette-3d-studio/';

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? repoBase : '/',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    sourcemap: false,
  },
});
