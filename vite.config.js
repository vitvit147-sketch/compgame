import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    tailwindcss(),
    react()
  ],
  build: {
    chunkSizeWarningLimit: 1000
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true
      }
    }
  }
})
