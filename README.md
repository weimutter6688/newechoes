# New Echoes 博客

基于 Astro 构建的个人博客系统。

## 开发环境

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 部署方式

### 方式一：GitHub Actions自动部署（推荐）

1. 在仓库的 Settings -> Secrets 中添加以下密钥：
```
SSH_PRIVATE_KEY: 服务器的SSH私钥
SSH_HOST: 服务器IP地址
SSH_USERNAME: 服务器用户名
GITHUB_TOKEN: GitHub个人访问令牌
```

2. 在项目根目录创建 `.github/workflows/deploy.yml` 文件：
```yaml
name: Deploy Blog

on:
  push:
    branches: [ main ]  # 当main分支有推送时触发

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Deploy to Server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          source: "dist/,package.json,package-lock.json,ecosystem.config.js"
          target: "/var/www/blog"
          
      - name: Restart PM2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SSH_HOST }}
          username: ${{ secrets.SSH_USERNAME }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/blog
            npm install --production
            pm2 restart blog || pm2 start ecosystem.config.js --env production
```

3. 推送代码到GitHub，Actions会自动执行部署流程

### 方式二：手动部署

#### 1. 环境准备

```bash
# 安装 Node.js LTS 版本
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2
npm install -g pm2
```

#### 2. 部署步骤（在生产服务器构建）

1. 创建网站目录：
```bash
mkdir -p /var/www/blog
sudo chown -R $USER:$USER /var/www/blog
```

2. 创建环境配置文件 `/var/www/blog/.env.production`：
```env
HOST=0.0.0.0
PORT=4321
GITHUB_TOKEN=your_github_token
```

3. 将源代码复制到服务器：
```bash
# 假设使用Git，首次部署时克隆仓库
git clone your-repo-url /var/www/blog

# 或者直接从本地复制源代码（不包括node_modules和dist目录）
rsync -av --exclude='node_modules' --exclude='dist' ./ your-server:/var/www/blog/
```

4. 在服务器上构建：
```bash
cd /var/www/blog

# 安装所有依赖（包括开发依赖）
npm install

# 构建项目
npm run build

# 删除开发依赖，只保留生产依赖
npm ci --omit=dev
```

5. 创建 PM2 配置文件 `/var/www/blog/ecosystem.config.js`：
```javascript
module.exports = {
  apps: [{
    name: "blog",
    script: "npm",
    args: "start",
    env_production: {
      NODE_ENV: "production",
      HOST: "0.0.0.0",
      PORT: "4321"
    },
    exp_backoff_restart_delay: 100,
    max_memory_restart: "256M"
  }]
}
```

6. 配置 Nginx `/etc/nginx/conf.d/blog.conf`：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4321;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源处理
    location /assets {
        proxy_pass http://localhost:4321;
        proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    # 会话文件存储目录的访问控制
    location /_astro {
        deny all;
    }
}
```

7. 启动应用：
```bash
cd /var/www/blog
pm2 start ecosystem.config.js --env production
pm2 startup
pm2 save

# 重启 Nginx
sudo nginx -t
sudo systemctl restart nginx
```

#### 3. 更新部署

```bash
cd /var/www/blog

# 如果使用Git
git pull

# 或者使用rsync更新源码
rsync -av --exclude='node_modules' --exclude='dist' ./ your-server:/var/www/blog/

# 重新构建
npm install
npm run build
npm ci --omit=dev

# 重启应用
pm2 restart blog
```

### 4. 维护命令

```bash
# 查看应用状态
pm2 status

# 查看实时日志
pm2 logs blog

# 监控资源使用
pm2 monit

# 重启应用
pm2 restart blog

# 停止应用
pm2 stop blog

# 删除应用
pm2 delete blog
```

## SEO 优化指南

### 1. 文章结构标准

#### 目录组织
```
src/content/
├── Windows/          # Windows系统相关
│   ├── PowerShell/  # PowerShell脚本
│   └── Tools/       # Windows工具
├── Linux/           # Linux系统
│   ├── Ubuntu/      # Ubuntu特定
│   └── CentOS/      # CentOS特定
├── Python/          # Python开发
│   ├── Django/      # Django框架
│   └── Flask/       # Flask框架
└── DevOps/          # 自动化运维
    ├── Docker/      # 容器化
    └── CI-CD/       # 持续集成
```

### 2. 文章 Frontmatter 规范

```yaml
---
title: "完整的技术指南标题"
date: 2024-04-17
summary: "简洁的技术描述（150字以内）"
tags: 
  - Linux
  - Docker
  - Nginx
category: "Linux"           # 主分类
technologies:              # 使用的技术栈
  - Ubuntu 22.04
  - Docker
  - Nginx 1.24
codeLanguages:            # 涉及的编程语言
  - bash
  - yaml
difficulty: "intermediate" # 难度：beginner/intermediate/advanced
prerequisites:            # 前置要求
  - 基础Linux命令
  - Docker基础知识
image: "/images/article-cover.png"
---
```

### 3. 技术文章结构

```markdown
# 文章标题

## 概述
- 技术背景
- 适用场景
- 预期结果

## 环境要求
- 系统版本
- 依赖工具
- 前置知识

## 实现步骤

### 1. 步骤一标题
具体操作说明...

```bash
# 命令示例
command here
```

预期输出：
```
output here
```

### 2. 步骤二标题
...

## 问题排查
- 常见问题1
  - 原因分析
  - 解决方案
- 常见问题2
  ...

## 扩展阅读
- 相关技术链接
- 官方文档
- 进阶主题
```

### 4. SEO 优化要点

1. 技术关键词优化
- 在开头明确技术版本
- 使用规范的技术术语
- 包含错误代码（如果相关）

2. 代码块优化
- 添加语言标识
- 包含注释说明
- 显示命令输出

3. 图片优化
- 使用描述性alt文本
- 压缩图片大小
- 展示关键步骤截图

4. 内部链接
- 链接相关技术文章
- 引用基础概念
- 推荐进阶阅读

### 5. 技术文档 Meta 优化

在Layout组件中添加：
```html
<meta name="technical:framework" content="框架名称和版本" />
<meta name="technical:language" content="编程语言" />
<meta name="technical:platform" content="运行平台" />
<meta name="robots" content="index, follow, max-image-preview:large" />
```

### 6. 相关文件优化

1. robots.txt
```txt
User-agent: *
Allow: /
Disallow: /draft/
Sitemap: https://yourdomain.com/sitemap.xml

# 允许爬取技术文档
Allow: /*.md$
Allow: /*.mdx$
```

2. sitemap.xml
- 技术文章优先级设置为0.8
- 分类页面优先级设置为0.6
- 更新频率设置为weekly

## 运维注意事项

1. 确保设置了正确的环境变量，特别是 `GITHUB_TOKEN`
2. 建议配置 HTTPS，可以使用 Let's Encrypt 获取免费证书
3. 定期检查日志确保应用运行正常
4. 建议配置服务器防火墙，只开放必要端口
5. 重要数据建议定期备份
6. 如果使用 GitHub Actions，请确保正确配置所有必需的 secrets
7. 在生产服务器上构建时，确保服务器有足够的内存和磁盘空间