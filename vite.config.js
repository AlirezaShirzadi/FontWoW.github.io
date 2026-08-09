import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    legacy({
      targets: ['Android >= 7', 'iOS >= 12'],
    })
  ],
  build: {
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
