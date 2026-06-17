import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const googleMapsKey = env.VITE_GOOGLE_MAPS_API_KEY || env.google_maps || '';
  const backendDevPort = env.PORT || '3000';
  /** VPS con poca RAM: vite build --mode vps (sin minify, menos paralelismo). */
  const isVpsBuild = mode === 'vps';

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
      // Minificar ~3MB de JS en VPS pequeño dispara el OOM killer (exit 137).
      minify: isVpsBuild ? false : 'esbuild',
      cssMinify: !isVpsBuild,
      reportCompressedSize: !isVpsBuild,
      rollupOptions: {
        maxParallelFileOps: isVpsBuild ? 2 : 20,
        input: 'index.html',
        output: isVpsBuild
          ? undefined
          : {
              manualChunks(id) {
                if (!id.includes('node_modules')) return;
                if (id.includes('recharts') || id.includes('d3-')) return 'charts';
                if (id.includes('jspdf')) return 'pdf';
                // IMPORTANT: avoid overly-broad `includes('react')` because it captures
                // packages like `react-is`, `react-router`, etc. and can create circular
                // chunk dependencies (and runtime undefined imports) in production builds.
                if (
                  /node_modules\/(react|react-dom|scheduler)\//.test(id) ||
                  /node_modules\/react\/jsx-runtime/.test(id) ||
                  /node_modules\/react\/jsx-dev-runtime/.test(id)
                ) {
                  return 'react-vendor';
                }
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
        '/sitemap.xml': {
          target: `http://localhost:${backendDevPort}`,
          changeOrigin: true,
          secure: false,
        },
        '/robots.txt': {
          target: `http://localhost:${backendDevPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
