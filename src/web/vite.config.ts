import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // The FastAPI backend (M3) runs on :8000. Proxy API calls so the browser
    // sees one origin and the session cookie just works.
    proxy: {
      '/api': 'http://localhost:8000',
      '/connect': 'http://localhost:8000',
    },
  },
})
