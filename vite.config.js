import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_PAGES_BASE || (process.env.GITHUB_PAGES === 'true' ? '/bujju-games/' : '/'),
  build: {
    rollupOptions: {
      output: { manualChunks: { three: ['three'] } },
    },
  },
});
