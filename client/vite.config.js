import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'esnext', // Support top-level await used by pdfjs-dist
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
})
