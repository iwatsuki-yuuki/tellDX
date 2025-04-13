// frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // FastAPIのポート
        changeOrigin: true,
      }
    }
  },
  esbuild: {
    loader: {
      '.js': 'jsx'  // JSファイルでもJSXを使えるようにする
    }
  }
});