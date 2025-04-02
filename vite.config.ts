import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg'],
  
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        redirects: path.resolve(__dirname, 'public/_redirects')
      }
    }
  },
  
  publicDir: 'public'
});