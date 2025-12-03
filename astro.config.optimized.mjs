// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    },
    imageService: "cloudflare"
  }),
  // 性能优化配置
  vite: {
    build: {
      // 启用压缩
      assetsInlineLimit: 4096,
      // 启用代码分割
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['chart.js']
          }
        }
      }
    },
    // 启用缓存
    cacheDir: './node_modules/.vite-cache'
  },
  // 压缩HTML输出
  compressHTML: true
});