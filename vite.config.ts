import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const googleMapsKey = env.VITE_GOOGLE_MAPS_API_KEY || env.google_maps || '';
  const backendDevPort = env.PORT || '3000';

  return {
    plugins: [react()],
    publicDir: 'public',
    define: {
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(googleMapsKey),
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    build: {
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        input: 'index.html',
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('recharts') || id.includes('d3-')) return 'charts';
            if (id.includes('jspdf')) return 'pdf';
            if (id.includes('react')) return 'react-vendor';
            return 'vendor';
          },
        },
      },
    },
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${backendDevPort}`,
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: `http://localhost:${backendDevPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
