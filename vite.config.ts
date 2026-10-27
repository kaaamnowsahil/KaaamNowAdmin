import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode === 'development' ? 'dev' : mode, process.cwd(), 'VITE_');
  // Unit tests stub `fetch`; they only need a syntactically valid base URL.
  const apiBaseUrl = mode === 'test' ? 'http://api.test' : env.VITE_API_BASE_URL;

  return {
    // Served at kaaamnow.in/admin (proxied from the main site), so assets live under /admin/.
    base: '/admin/',
    build: { outDir: 'dist/admin' },
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5174 },
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl),
    },
  };
});
