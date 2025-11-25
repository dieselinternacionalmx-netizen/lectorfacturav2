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
    target: 'esnext',
    rollupOptions: {
      external: ['pdfjs-dist'], // Exclude from bundle (loaded via CDN)
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext',
    },
  },
})
