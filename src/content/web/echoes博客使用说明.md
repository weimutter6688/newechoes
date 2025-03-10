---
title: "echoes博客使用说明"
date: 2025-03-09T01:07:23Z
tags: []
---

这是一个基于 Astro + React 构建的个人博客系统，具有文章管理、项目展示、观影记录、读书记录等功能。本文将详细介绍如何使用和配置这个博客系统。

## 功能特点

1. **响应式设计**：完美适配桌面端和移动端
2. **深色模式**：支持自动和手动切换深色/浅色主题
3. **文章系统**：支持 Markdown 写作，带有标签和分类
4. **项目展示**：支持展示 GitHub、Gitea 和 Gitee 的项目
5. **观影记录**：集成豆瓣观影数据
6. **读书记录**：集成豆瓣读书数据

## 基础配置

主要配置文件位于 `src/consts.ts`，你需要修改以下内容：

```typescript
// 网站基本信息
export const SITE_URL = 'https://your-domain.com';
export const SITE_NAME = "你的网站名称";
export const SITE_DESCRIPTION = "网站描述";

// 导航链接
export const NAV_LINKS = [
    { href: '/', text: '首页' },
    { href: '/articles', text: '文章' },
    { href: '/movies', text: '观影' },
    { href: '/books', text: '读书' },
    { href: '/projects', text: '项目' },
    { href: '/other', text: '其他' }
];

// 备案信息（如果需要）
export const ICP = '你的ICP备案号';
export const PSB_ICP = '你的公安备案号';
export const PSB_ICP_URL = '备案链接';

// 豆瓣配置
export const DOUBAN_ID = '你的豆瓣ID';
```

## 文章写作

### 创建新文章

你可以通过以下两种方式创建新文章：

#### 1. 使用创建脚本（推荐）

项目根目录下提供了 `create_post.sh` 脚本来快速创建文章：

```bash
# 添加执行权限（首次使用时）
chmod +x create_post.sh

# 方式1：交互式创建
./create_post.sh
# 按提示输入文章标题和路径

# 方式2：命令行参数创建
./create_post.sh "文章标题" "目录/文章路径"
# 例如：./create_post.sh "我的新文章" "web/my-post"
```

脚本会自动：

- 在指定位置创建文章文件
- 添加必要的 frontmatter（标题、日期、标签）
- 检查文件是否已存在
- 显示文件的绝对路径

#### 2. 手动创建

在 `src/content/articles` 目录下创建 `.md` 或 `.mdx` 文件。文章需要包含以下前置信息：

```markdown
---
title: "文章标题"
date: YYYY-MM-DD
tags: ["标签1", "标签2"]
---

文章内容...
```

### 文章列表展示

文章列表页面会自动获取所有文章并按日期排序展示，支持：

- 文章标题和摘要
- 发布日期
- 标签系统
- 阅读时间估算

## 项目展示

项目展示页面支持从 GitHub、Gitea 和 Gitee 获取和展示项目信息。

### GitProjectCollection 组件

用于展示 Git 平台的项目列表。

基本用法：

```astro
---
import GitProjectCollection from '@/components/GitProjectCollection';
import { GitPlatform, type GitConfig } from '@/components/GitProjectCollection';

// Gitea 配置示例
const giteaConfig: GitConfig = {
  username: 'your-username',      // 必填：用户名
  token: 'your-token',           // 可选：访问令牌，用于访问私有仓库
  perPage: 10,                   // 可选：每页显示数量，默认 10
  url: 'your-git-url'         // Gitea 必填，GitHub/Gitee 无需填写
};
---

<GitProjectCollection 
  platform={GitPlatform.GITEA}   // 平台类型：GITHUB、GITEA、GITEE
  username="your-username"       // 可选：覆盖 config 中的用户名
  title="Git 项目"            // 显示标题
  config={giteaConfig}          // 平台配置
  client:load                   // Astro 指令：客户端加载
/>
```

## 观影和读书记录

### MediaGrid 组件

`MediaGrid` 组件用于展示豆瓣的观影和读书记录。

#### 基本用法

```astro
---
import MediaGrid from '@/components/MediaGrid.astro';
---

// 展示电影记录
<MediaGrid 
  type="movie"              // 类型：movie 或 book
  title="我看过的电影"      // 显示标题
  doubanId={DOUBAN_ID}     // 使用配置文件中的豆瓣ID
/>

// 展示读书记录
<MediaGrid 
  type="book"
  title="我读过的书"
  doubanId={DOUBAN_ID}
/>
```

## 主题切换

系统支持三种主题模式：

1. 跟随系统
2. 手动切换浅色模式
3. 手动切换深色模式

主题设置会被保存在浏览器的 localStorage 中。

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 pnpm

### 安装步骤

1. 克隆项目

 ```bash
  git clone https://github.com/your-username/echoes.git
  cd echoes
  ```

2. 安装依赖

  ```bash
  npm install
  # 或者使用 pnpm
  pnpm install
  ```

3. 修改配置

  编辑 `src/consts.ts` 文件，更新网站配置信息。

4. 本地运行
  
```bash
npm run dev
# 或者使用 pnpm
pnpm dev
```

访问 `http://localhost:4321` 查看效果。

## 部署说明

### 本地构建部署

```bash
npm run build
```

构建产物位于 `dist` 目录，将其部署到你的服务器即可。

### Vercel 部署

本项目完全支持 Vercel 部署，你可以通过以下步骤快速部署：

1. Fork 本项目到你的 GitHub 账号

2. 在 Vercel 控制台中点击 "New Project"

3. 导入你 fork 的 GitHub 仓库

4. 配置构建选项：
   - Framework Preset: Astro
   - Build Command: `astro build`
   - Output Directory: `dist`
   - Install Command: `npm install` 或 `pnpm install`

5. 点击 "Deploy" 开始部署

Vercel 会自动检测项目类型并应用正确的构建配置。每次你推送代码到 main 分支时，Vercel 都会自动重新部署。

#### 环境变量配置

如果你使用了需要环境变量的功能（如 API tokens），需要在 Vercel 项目设置中的 "Environment Variables" 部分添加相应的环境变量。

## 常见问题

1. **图片无法显示**
   - 检查图片路径是否正确
   - 确保图片已放入 `public` 目录

2. **豆瓣数据无法获取**
   - 确认豆瓣 ID 配置正确
   - 检查豆瓣记录是否公开

3. **Git 项目无法显示**
   - 验证用户名配置
   - 确认 API 访问限制
