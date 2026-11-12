import { resolve } from 'node:path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

const rendererCspPlugin: Plugin = {
  name: 'renderer-csp',
  transformIndexHtml(html, context) {
    const isDevelopment = context.server !== undefined;
    return html
      .replace('__STYLE_SRC__', isDevelopment ? "'self' 'unsafe-inline'" : "'self'")
      .replace('__CONNECT_SRC__', isDevelopment ? "'self' ws://localhost:5173" : "'self'");
  },
};

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'electron/main.ts'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'electron/preload.ts'),
      },
    },
  },
  renderer: {
    root: resolve(__dirname, 'src'),
    plugins: [react(), rendererCspPlugin],
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'src/index.html'),
      },
    },
  },
});
