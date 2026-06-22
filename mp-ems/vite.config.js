import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Migrated from Create React App (react-scripts) to Vite.
export default defineConfig({
    // Deployment sub-path. Replaces CRA's package.json "homepage": "/ems".
    // Exposed to app code as import.meta.env.BASE_URL ("/ems/").
    base: '/ems/',

    plugins: [react()],

    server: {
        port: 3000,        // keep CRA's dev port (matches backend CORS allow-list)
        host: true,        // expose on LAN
        open: false,
    },

    build: {
        outDir: 'build',   // keep CRA's output folder so deploy steps are unchanged
        sourcemap: false,
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                // Split heavy third-party libs into their own cacheable chunks.
                // Combined with route-level lazy loading, these only download on
                // the pages that actually use them (e.g. xlsx on report exports).
                // Only peel off heavy, leaf-like libraries. Keep React & co. in the
                // shared `vendor` chunk to avoid circular chunk references.
                manualChunks(id) {
                    if (!id.includes('node_modules')) return undefined;
                    if (id.includes('xlsx')) return 'vendor-xlsx';
                    if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-charts';
                    if (id.includes('react-icons')) return 'vendor-icons';
                    if (id.includes('lucide-react')) return 'vendor-lucide';
                    return 'vendor';
                },
            },
        },
    },

    // This project keeps JSX inside .js files (CRA allowed it). Vite/esbuild only
    // treat .jsx as JSX by default, so tell esbuild to parse .js as JSX too.
    esbuild: {
        loader: 'jsx',
        include: /src\/.*\.jsx?$/,
        exclude: [],
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: { '.js': 'jsx' },
        },
    },

    // Vitest configuration (test runner replacing CRA's jest).
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
        css: false,
    },
});
