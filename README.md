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

### 方式一：GitHub Actions 自动部署（推荐）

1.  在仓库的 Settings -> Secrets & Variables -> Actions 中添加以下 Secrets：
    ```
    SSH_PRIVATE_KEY: 生产服务器的 SSH 私钥
    SSH_HOST: 生产服务器的 IP 地址或域名
    SSH_USERNAME: 登录生产服务器的用户名
    TARGET_DIR: 部署到服务器的目标路径 (例如 /var/www/blog)
    PM2_APP_NAME: PM2 应用的名称 (例如 my-astro-app)
    ```

2.  在项目根目录创建或更新 `.github/workflows/deploy.yml` 文件：
    ```yaml
    name: Deploy Blog to Production

    on:
      push:
        branches: [ main ] # 仅在 main 分支有推送时触发

    jobs:
      deploy:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout code
            uses: actions/checkout@v4

          - name: Setup Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '18' # 确保与服务器环境一致
              cache: 'npm'

          - name: Install dependencies
            run: npm ci # 使用 ci 进行干净安装

          - name: Build project
            run: npm run build
            env:
              # 如果构建需要环境变量，在此处添加
              # GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

          - name: Deploy to Server via SCP
            uses: appleboy/scp-action@master
            with:
              host: ${{ secrets.SSH_HOST }}
              username: ${{ secrets.SSH_USERNAME }}
              key: ${{ secrets.SSH_PRIVATE_KEY }}
              source: "dist/, package.json, package-lock.json, ecosystem.config.cjs" # 复制必要的文件
              target: ${{ secrets.TARGET_DIR }} # 使用 Secret 定义目标目录
              strip_components: 1 # 根据 source 结构调整，如果 source 直接是文件和 dist/，则不需要

          - name: Run Deployment Script on Server via SSH
            uses: appleboy/ssh-action@master
            with:
              host: ${{ secrets.SSH_HOST }}
              username: ${{ secrets.SSH_USERNAME }}
              key: ${{ secrets.SSH_PRIVATE_KEY }}
              script: |
                cd ${{ secrets.TARGET_DIR }}
                echo "Installing production dependencies..."
                npm install --omit=dev --no-save
                echo "Restarting PM2 application..."
                # 使用 Secret 定义应用名称，并使用 .cjs 配置文件
                pm2 restart ${{ secrets.PM2_APP_NAME }} || pm2 start ecosystem.config.cjs --name ${{ secrets.PM2_APP_NAME }}
                pm2 save # 保存 PM2 进程列表，以便服务器重启后恢复
                echo "Deployment finished."
    ```

3.  将代码推送到 `main` 分支，GitHub Actions 将自动执行构建和部署流程。

### 方式二：手动部署

#### 1. 环境准备（在生产服务器执行）

确保您的生产服务器已安装：
*   Node.js (版本 >= 18.x 推荐)
*   npm (通常随 Node.js 一起安装)
*   PM2 (`sudo npm install -g pm2`)
*   Nginx (`sudo apt update && sudo apt install nginx` 或类似命令)
*   Git (如果使用 Git 拉取代码)

#### 2. 部署步骤（在生产服务器执行）

1.  **创建部署目录并设置权限**
    ```bash
    # 设置部署目录路径变量 (根据需要修改)
    export TARGET_DIR="/var/www/blog"
    # 设置运行应用的非 root 用户名 (推荐)
    export APP_USER="your_app_user" # 替换为实际用户名

    sudo mkdir -p $TARGET_DIR
    # 将目录所有权交给指定用户
    sudo chown -R $APP_USER:$APP_USER $TARGET_DIR
    # 切换到应用用户进行后续操作 (如果当前不是该用户)
    # sudo -iu $APP_USER
    cd $TARGET_DIR
    ```
    *注意：以非 root 用户运行 Node.js 应用是更安全的实践。*

2.  **获取或更新源代码**
    ```bash
    # 切换到部署目录 (如果不在)
    cd $TARGET_DIR

    # 方式一：使用 Git (推荐)
    # 首次部署:
    # git clone your-repo-url .
    # 后续更新:
    # git pull origin main

    # 方式二：使用 rsync 从本地复制 (确保目标服务器上有 rsync)
    # rsync -avz --delete --exclude='.git' --exclude='node_modules' --exclude='dist' /path/to/local/project/ $APP_USER@your_server:$TARGET_DIR/
    ```
    *确保将项目文件 (包括 `dist`, `package.json`, `package-lock.json`, `ecosystem.config.cjs`) 传输到 `$TARGET_DIR`。*

3.  **安装依赖并构建项目 (如果不在服务器构建，则跳过构建步骤)**
    *   **如果源代码已包含 `dist` 目录 (例如本地构建后传输)：**
        ```bash
        cd $TARGET_DIR
        # 安装仅生产依赖
        npm install --omit=dev --no-save
        ```
    *   **如果在服务器上构建：**
        ```bash
        cd $TARGET_DIR
        npm install # 安装所有依赖
        npm run build # 执行构建
        # 清理并安装仅生产依赖
        npm install --omit=dev --no-save
        ```

4.  **确认 PM2 配置文件**
    *   确保 `ecosystem.config.cjs` 文件位于 `$TARGET_DIR`。
    *   检查文件内容，特别是 `name`, `script`, `args`：
    ```javascript
    // ecosystem.config.cjs
    module.exports = {
      apps : [{
        name   : "my-astro-app", // <--- **重要：** 应用名称，用于 PM2 管理
        script : "node",
        args   : "dist/server/entry.mjs", // <--- Astro SSR 构建产物入口
        // instance_var: 'INSTANCE_ID', // 可选
        // instances : 1,             // 实例数，可为 'max'
        // exec_mode : 'cluster',     // 集群模式，需 instances > 1
        watch  : false,             // 生产环境通常关闭 watch
        max_memory_restart: '256M', // 根据服务器资源调整
        env: {                      // 环境变量
          NODE_ENV: "production",
          // HOST: "0.0.0.0",       // Node 服务监听的主机
          // PORT: 4321             // Node 服务监听的端口
        }
      }]
    };
    ```
    *   *注意：`args` 指向的是 Node.js 启动的脚本。Astro SSR 模式默认是 `dist/server/entry.mjs`。确保您的 Node.js 应用监听的地址和端口（默认 `localhost:4321`）与 Nginx 配置中的 `proxy_pass` 目标一致。*

5.  **配置 Nginx 反向代理**
    *   创建或编辑 Nginx 站点配置文件：
        ```bash
        sudo nano /etc/nginx/sites-available/my-astro-app.conf
        ```
    *   粘贴并修改以下配置 (将 `your_domain.com` 替换为您的域名或 IP，将 `localhost:4321` 替换为 PM2 应用实际监听的地址和端口)：
        ```nginx
        server {
            listen 80;
            listen [::]:80; # 监听 IPv6

            server_name your_domain.com www.your_domain.com; # <--- 替换

            # 安全增强：隐藏 Nginx 版本号
            server_tokens off;

            # 应用根目录 (指向构建后的客户端文件)
            root /var/www/blog/dist/client; # <--- 确保路径与 $TARGET_DIR/dist/client 匹配
            index index.html index.htm;

            # 日志文件路径 (可选，建议为每个站点配置独立日志)
            access_log /var/log/nginx/my-astro-app.access.log;
            error_log /var/log/nginx/my-astro-app.error.log;

            # Gzip 压缩 (可选，提高前端加载速度)
            gzip on;
            gzip_vary on;
            gzip_proxied any;
            gzip_comp_level 6;
            gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

            location / {
                # 转发请求到 Node.js 应用
                proxy_pass http://localhost:4321; # <--- **重要：** 确保端口正确

                # 必要的代理头设置
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host; # 传递原始 Host 头
                proxy_set_header X-Real-IP $remote_addr; # 传递真实客户端 IP
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; # 传递代理链 IP
                proxy_set_header X-Forwarded-Proto $scheme; # 传递原始协议 (http/https)
                proxy_cache_bypass $http_upgrade;

                # 尝试直接服务静态文件，找不到则转发给后端 Node 应用
                # 这对于 Astro 的静态资源（图片、CSS、JS）很重要
                try_files $uri $uri/ @proxy;
            }

            # 内部 location 用于转发
            location @proxy {
                proxy_pass http://localhost:4321; # <--- **重要：** 确保端口正确
                # 再次设置必要的头信息
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
                proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                proxy_set_header X-Forwarded-Proto $scheme;
            }

            # 可选: 对特定静态资源添加更长的浏览器缓存时间
            # location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|webp|woff|woff2)$ {
            #    expires 1M; # 缓存 1 个月
            #    access_log off; # 关闭这些资源的访问日志
            #    add_header Cache-Control "public";
            # }

            # 禁止访问隐藏文件和特定目录
            location ~ /\. {
                deny all;
            }
            location ~ /node_modules/ {
                deny all;
            }
            location = /ecosystem.config.cjs {
                deny all;
            }
        }
        ```

6.  **启用 Nginx 配置**
    ```bash
    # 创建符号链接 (如果已存在同名文件，先用 sudo rm 删除)
    sudo ln -s /etc/nginx/sites-available/my-astro-app.conf /etc/nginx/sites-enabled/
    # (可选) 移除默认配置冲突
    # sudo rm /etc/nginx/sites-enabled/default
    # 测试 Nginx 配置语法
    sudo nginx -t
    # 如果测试成功，重新加载 Nginx 服务
    sudo systemctl reload nginx
    ```

7.  **使用 PM2 启动/管理应用**
    *   切换到应用用户 (如果之前没有切换)： `sudo -iu $APP_USER`
    *   导航到应用目录：`cd $TARGET_DIR`
    *   首次启动：
        ```bash
        pm2 start ecosystem.config.cjs
        ```
    *   设置 PM2 开机自启 (PM2 会提供需要以 root 权限运行的命令)：
        ```bash
        pm2 startup
        # (根据提示，复制并以 root/sudo 权限运行生成的命令)
        ```
    *   保存当前 PM2 进程列表：
        ```bash
        pm2 save
        ```

#### 3. 更新部署

```bash
# 切换到应用用户 (如果需要)
# sudo -iu $APP_USER
cd $TARGET_DIR

# 1. 获取最新代码
# git pull origin main
# 或者 rsync ...

# 2. 重新安装依赖并构建 (如果适用)
npm install
npm run build # 如果在服务器构建
npm install --omit=dev --no-save

# 3. 重启 PM2 应用 (使用 ecosystem.config.cjs 中的 name)
pm2 restart my-astro-app

# 4. (可选) 如果 Nginx 配置有更改
# sudo nginx -t && sudo systemctl reload nginx
```

#### 4. 维护命令 (以应用用户身份运行)

```bash
# 查看应用状态
pm2 status

# 查看指定应用日志 (使用 ecosystem.config.cjs 中的 name)
pm2 logs my-astro-app

# 实时监控资源
pm2 monit

# 重启应用
pm2 restart my-astro-app

# 停止应用
pm2 stop my-astro-app

# 删除应用 (将从 PM2 列表中移除)
pm2 delete my-astro-app
```

---

详细的 SEO 优化指南请参见 [SEO_GUIDE.md](SEO_GUIDE.md)。
