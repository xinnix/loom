import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@config': path.resolve(__dirname, './src/config'),
      '@core': path.resolve(__dirname, './src/core'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  optimizeDeps: {
    // @loom/shared 为 CJS 构建产物（API 端 Node 要求），dev 下需 esbuild 预打包成 ESM，
    // 否则浏览器原生 ESM 无法解构 named export（build 走 commonjsOptions 不受影响）
    include: ['quill', '@loom/shared'],
  },
  build: {
    commonjsOptions: {
      include: [/quill/, /node_modules/, /infra\/shared/],
    },
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('quill')) return 'quill';
          if (id.includes('antd')) return 'antd';
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router'))
            return 'react-vendor';
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/trpc': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
