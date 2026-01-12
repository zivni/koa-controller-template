import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import react from '@vitejs/plugin-react';
import EntryShakingPlugin from 'vite-plugin-entry-shaking';
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
        outDir: mode === 'local' ? '../server/public/dist' : 'dist',
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