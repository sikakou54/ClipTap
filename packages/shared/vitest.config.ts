import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** apps/web のソースをテストから読むためのパス別名（apps/web/tsconfig.app.json と対応） */
const webSrc = fileURLToPath(new URL('../../apps/web/src/', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@components': `${webSrc}components`,
      '@hooks': `${webSrc}hooks`,
      '@adapters': `${webSrc}adapters`,
      '@services': `${webSrc}services`,
      '@utils': `${webSrc}utils`,
      '@constants': `${webSrc}constants`,
      '@database': `${webSrc}database`,
      '@providers': `${webSrc}providers`,
      '@pages': `${webSrc}pages`,
      '@src': webSrc.replace(/\/$/, ''),
    },
  },
});
