import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, '../shared'),
      '@features': resolve(__dirname, './src/features'),
      '@components': resolve(__dirname, './src/shared/components'),
      '@hooks': resolve(__dirname, './src/shared/hooks'),
      '@utils': resolve(__dirname, './src/shared/utils'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0', // Required for Docker
    watch: {
      usePolling: true, // Required for Docker on Windows/Mac
      interval: 1000,
    },
    proxy: {
      '/graphql': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          apollo: ['@apollo/client', 'graphql'],
          xstate: ['xstate', '@xstate/react'],
        },
      },
    },
  },
});
