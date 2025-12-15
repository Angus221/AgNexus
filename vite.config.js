import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, renameSync, rmdirSync } from 'fs';

export default defineConfig({
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.js'),
        floatball: resolve(__dirname, 'src/content/floatball.js'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background.js';
          if (chunkInfo.name === 'floatball') return 'content/floatball.js';
          return 'sidepanel/js/[name].[hash].js';
        },
        chunkFileNames: 'sidepanel/js/chunks/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'sidepanel/styles/[name].[hash][extname]';
          }
          if (assetInfo.name === 'index.html') {
            return 'sidepanel/index.html';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@modules': resolve(__dirname, 'src/sidepanel/js'),
      '@styles': resolve(__dirname, 'src/sidepanel/styles'),
    },
  },
  plugins: [
    {
      name: 'copy-manifest-and-icons',
      closeBundle() {
        // 确保 dist 目录存在
        const distDir = resolve(__dirname, 'dist');
        if (!existsSync(distDir)) {
          mkdirSync(distDir, { recursive: true });
        }

        // 复制 manifest.json
        copyFileSync(
          resolve(__dirname, 'public/manifest.json'),
          resolve(__dirname, 'dist/manifest.json')
        );

        // 复制 icons
        const iconsDir = resolve(__dirname, 'dist/icons');
        if (!existsSync(iconsDir)) {
          mkdirSync(iconsDir, { recursive: true });
        }
        ['icon16.png', 'icon48.png', 'icon128.png', 'icon.jpg'].forEach(file => {
          copyFileSync(
            resolve(__dirname, 'public/icons', file),
            resolve(__dirname, 'dist/icons', file)
          );
        });

        // 移动 index.html 到正确位置
        const wrongPath = resolve(__dirname, 'dist/src/sidepanel/index.html');
        const correctPath = resolve(__dirname, 'dist/sidepanel/index.html');
        if (existsSync(wrongPath)) {
          const sidepanelDir = resolve(__dirname, 'dist/sidepanel');
          if (!existsSync(sidepanelDir)) {
            mkdirSync(sidepanelDir, { recursive: true });
          }
          renameSync(wrongPath, correctPath);

          // 清理空的 src 目录
          try {
            rmdirSync(resolve(__dirname, 'dist/src/sidepanel'));
            rmdirSync(resolve(__dirname, 'dist/src'));
          } catch (e) {
            // 忽略错误
          }
        }
      },
    },
  ],
});
