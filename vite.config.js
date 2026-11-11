import { defineConfig } from 'vite';

// base './' makes every asset path relative, so the build works on
// GitHub Pages whether it is served from /<repo>/ or a custom domain.
export default defineConfig({
  base: './',
  build: { target: 'es2020', chunkSizeWarningLimit: 800 },
});
