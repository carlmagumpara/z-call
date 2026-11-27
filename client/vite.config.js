import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      // Same path shape as production: Vercel routes /api/socket-io to the
      // single function, so the dev server just forwards it unchanged.
      '/api/socket-io': {
        target: `http://localhost:${process.env.PORT || 4000}`,
        ws: true,
      },
    },
  },
});
