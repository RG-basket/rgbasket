import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: true, // Enable sourcemaps for debugging
  },
  server: {
    port: 5173,
    host: true
  },
  // Explicitly define preview server
  preview: {
    port: 4173,
    host: true
  }
})