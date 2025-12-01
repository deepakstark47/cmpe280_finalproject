import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Allow Fast Refresh to work with context files that export both hooks and components
      fastRefresh: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api/runpod': {
        target: 'https://api.runpod.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/runpod/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Forward the Authorization header if present
            const authHeader = req.headers.authorization;
            if (authHeader) {
              proxyReq.setHeader('Authorization', authHeader);
            }
          });
        },
      },
    },
  },
  publicDir: 'public',
  assetsInclude: ['**/*.PNG', '**/*.png'],
})

