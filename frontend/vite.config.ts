import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import react from '@vitejs/plugin-react';
import EntryShakingPlugin from 'vite-plugin-entry-shaking';
import outputManifest from 'rollup-plugin-output-manifest';
import { resolve } from 'node:path';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        checker({ typescript: true }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        EntryShakingPlugin({
            targets: [
                // Using direct paths.
                resolve(__dirname, 'src/main.tsx'),
            ]
        }),
    ],
    build: {
        outDir: mode === 'local_build' ? '../server/public/dist' : 'dist',
        sourcemap: true,
        emptyOutDir: true,
        rollupOptions: {
            plugins: [outputManifest({ fileName: "frontend_files.json", nameWithExt: false })]
        }
    },
    server: {
        host: true,
        port: 5100,
        proxy: {
            '/restricted': {
                target: 'http://localhost:4002',
                changeOrigin: true,
            },
        }
    },
}));