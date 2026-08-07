import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react()
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@capacitor')) {
              return 'capacitor';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('html-to-image')) {
              return 'html-to-image';
            }
            return 'dependencies';
          }
        }
      }
    }
  },
  esbuild: {
    drop: ['console', 'debugger'],
  }
})
