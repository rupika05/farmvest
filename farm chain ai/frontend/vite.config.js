import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/price-suggestion': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/batch': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      '/batches': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'canvas-confetti']
        }
      }
    }
  }
});
