---
title: Astro 框架介绍
date: 2023-07-20
tags: [Astro, 前端, Web开发]
category: 技术
summary: Astro 是一个现代的静态站点生成器，专注于内容驱动的网站，本文将介绍其基本特性和使用方法。
---

# Astro 框架介绍

[Astro](https://astro.build/) 是一个现代的静态站点生成器，专注于内容驱动的网站。它允许开发者使用他们喜欢的 UI 组件框架（如 React、Vue、Svelte 等），同时生成快速、优化的静态 HTML。

## Astro 的主要特点

### 1. 零 JavaScript 默认

Astro 默认不会向客户端发送任何 JavaScript。这意味着您的网站将以闪电般的速度加载，因为浏览器不需要下载、解析和执行 JavaScript 代码。

### 2. 组件岛屿架构

Astro 引入了"组件岛屿"的概念，允许您在需要交互性的地方选择性地使用 JavaScript。这种方法确保了最佳的性能，同时仍然提供了丰富的用户体验。

```astro
---
import ReactCounter from '../components/ReactCounter.jsx';
import VueCounter from '../components/VueCounter.vue';
import SvelteCounter from '../components/SvelteCounter.svelte';
---

<!-- 这些组件将在客户端激活（水合） -->
<ReactCounter client:load />
<VueCounter client:visible />
<SvelteCounter client:idle />
```

### 3. 多框架支持

Astro 允许您在同一个项目中使用多种 UI 框架，如 React、Vue、Svelte、Solid 等。这意味着您可以使用最适合特定任务的工具，而不必被单一框架所限制。

### 4. 内置优化

Astro 自动优化您的网站，包括：

- 代码分割
- CSS 优化
- 图像优化
- 预渲染
- 延迟加载

## 基本使用

### 安装

使用以下命令创建一个新的 Astro 项目：

```bash
# 使用 npm
npm create astro@latest

# 使用 yarn
yarn create astro

# 使用 pnpm
pnpm create astro@latest
```

### 项目结构

一个基本的 Astro 项目结构如下：

```
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── Card.astro
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

### 创建页面

在 Astro 中，`src/pages/` 目录中的每个 `.astro` 文件都会生成一个对应的 HTML 页面：

```astro
---
// src/pages/index.astro
---

<html>
  <head>
    <title>我的 Astro 网站</title>
  </head>
  <body>
    <h1>欢迎来到我的网站！</h1>
  </body>
</html>
```

## 结语

Astro 是一个强大而灵活的框架，特别适合内容驱动的网站，如博客、文档站点、营销网站等。它的零 JavaScript 默认策略和组件岛屿架构使其成为构建高性能网站的绝佳选择。

如果您正在寻找一个能够提供出色开发体验和最终用户体验的框架，Astro 绝对值得一试！ 