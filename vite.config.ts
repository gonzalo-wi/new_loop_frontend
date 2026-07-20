import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Requests to /api/* are forwarded to the backend; /api prefix is stripped.
      // This avoids browser CORS restrictions during development.
      //http://192.168.0.42:8095 produccion - http://localhost:8080 
      '/api': {
        target: 'http://localhost:8080 ',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
