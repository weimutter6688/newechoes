// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import node from '@astrojs/node';
import remarkEmoji from 'remark-emoji';
import rehypeExternalLinks from 'rehype-external-links';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()],
  
  // 添加 Node.js 适配器配置
  adapter: node({
    mode: 'standalone' // 独立模式，适合大多数部署环境
  }),
  
  // Markdown 配置
  markdown: {
    syntaxHighlight: 'prism',
    remarkPlugins: [
      [remarkEmoji, { emoticon: true }] // 启用表情符号和情感符号
    ],
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] }]
    ],
    gfm: true, // GitHub Flavored Markdown
    shikiConfig: {
      // 选择一个主题 (可选)
      theme: 'github-dark',
      // 添加自定义语言
      langs: [],
      // 启用自动换行，防止水平滚动
      wrap: true,
    }
  }
});