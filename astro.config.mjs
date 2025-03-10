// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import remarkEmoji from 'remark-emoji';
import rehypeExternalLinks from 'rehype-external-links';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import path from 'node:path';
import { SITE_URL } from './src/consts';

import vercel from '@astrojs/vercel';

function getArticleDate(articleId) {
  try {
    // 处理多级目录的文章路径
    const mdPath = path.join(process.cwd(), 'src/content', articleId + '.md');
    const mdxPath = path.join(process.cwd(), 'src/content', articleId + '.mdx');
    
    let filePath = fs.existsSync(mdPath) ? mdPath : mdxPath;
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const match = content.match(/date:\s*(\d{4}-\d{2}-\d{2})/);
      if (match) {
        return new Date(match[1]).toISOString();
      }
    }
  } catch (error) {
    console.error('Error reading article date:', error);
  }
  return new Date().toISOString(); // 如果没有日期，返回当前时间
}

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: 'static',
  trailingSlash: 'ignore',

  build: {
    format: 'directory'
  },

  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          // 手动分块配置
          manualChunks: {
            // 将地图组件单独打包
            'world-heatmap': ['./src/components/WorldHeatmap.tsx'],
            // 将 React 相关库单独打包
            'react-vendor': ['react', 'react-dom'],
            // 其他大型依赖也可以单独打包
            'chart-vendor': ['chart.js'],
            // 将 ECharts 单独打包
            'echarts-vendor': ['echarts'],
            // 将其他组件打包到一起
            'components': ['./src/components']
          }
        }
      },
      // 提高警告阈值，避免不必要的警告
      chunkSizeWarningLimit: 1000
    }
  },

  integrations: [
    mdx({
      syntaxHighlight: 'prism',
      remarkPlugins: [
        [remarkEmoji, { emoticon: true }]
      ],
      rehypePlugins: [
        [rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] }]
      ],
      gfm: true,
      shikiConfig: {
        theme: 'github-dark',
        langs: [],
        wrap: true,
      }
    }),
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
          return {
            ...item,
            priority: 0.8,
            lastmod: publishDate
          };
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
      }
    })
  ],

  // Markdown 配置
  markdown: {
    syntaxHighlight: 'prism',
    remarkPlugins: [
      [remarkEmoji, { emoticon: true }]
    ],
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['nofollow', 'noopener', 'noreferrer'] }]
    ],
    gfm: true,
    shikiConfig: {
      theme: 'github-dark',
      langs: [],
      wrap: true,
    }
  },

  adapter: vercel()
});