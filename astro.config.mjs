// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import node from '@astrojs/node';
import remarkEmoji from 'remark-emoji';
import rehypeExternalLinks from 'rehype-external-links';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_URL } from './src/consts';

function getArticleDate(articleId) {
  try {
    const mdPath = path.join(process.cwd(), 'src/content', articleId + '.md');
    if (fs.existsSync(mdPath)) {
      const content = fs.readFileSync(mdPath, 'utf-8');
      const match = content.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
      if (match) {
        return new Date(match[1]).toISOString();
      }
    }
  } catch (error) {
    console.error('Error reading article date:', error);
  }
  return null;
}

// https://astro.build/config
export default defineConfig({
  site: SITE_URL, // 替换为您的实际网站 URL
  output: 'server',
  trailingSlash: 'ignore',
  build: {
    format: 'directory'
  },
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/api/'),
      serialize(item) {
        if (!item) return undefined;

        // 文章页面
        if (item.url.includes('/articles/')) {
          // 从 URL 中提取文章 ID
          const articleId = item.url.replace(SITE_URL + '/articles/', '').replace(/\/$/, '');
          const publishDate = getArticleDate(articleId);
          if (publishDate) {
            return {
              ...item,
              priority: 0.8,
              lastmod: publishDate
            };
          }
        }
        // 其他页面
        else {
          let priority = 0.7; // 默认优先级
          
          // 首页最高优先级
          if (item.url === SITE_URL + '/') {
            priority = 1.0;
          }
          // 文章列表页次高优先级
          else if (item.url === SITE_URL + '/articles/') {
            priority = 0.9;
          }

          return {
            ...item,
            priority
          };
        }
      },
      // 设置较小的条目限制，这样会自动分割成多个文件
      entryLimit: 5
    })
  ],
  
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