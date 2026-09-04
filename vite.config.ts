import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const hasCdn = Boolean(process.env.VITE_ASSET_BASE_URL);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // 当配置了 R2/CDN 外部资源基址时，无需将 2.85GB 的本地大文件打包进 dist，使发布体积从 2.8GB 骤降至 400KB
      copyPublicDir: !hasCdn,
    },
    server: {
      port: 3000,
      open: false,
    },
  };
});
