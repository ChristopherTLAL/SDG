// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react'; // 导入 react 插件

import vercel from '@astrojs/vercel';

export default defineConfig({
  integrations: [
    tailwind(),
    react() // 添加 react 插件
  ],

  adapter: vercel(),
});