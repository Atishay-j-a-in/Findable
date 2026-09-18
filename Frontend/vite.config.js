import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
     tailwindcss(),
  ],
  server: {
    // Dev proxy: browser calls same-origin /api/*, Vite forwards to Express.
    // No cross-origin request ever leaves the browser, so no CORS involved.
    proxy: {
      '/api': {
        target: 'http://localhost:5500',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
