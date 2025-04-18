module.exports = {
  apps : [{
    name   : "my-astro-app", // 应用名称，您可以根据需要修改
    script : "node",         // 使用 Node.js 运行
    args   : "dist/server/entry.mjs", // Astro 构建后的服务器入口文件路径
    watch  : false,          // 生产环境通常不建议启用 watch
    max_memory_restart: '1G', // 根据服务器配置调整内存限制
    env: {
      NODE_ENV: "production", // 设置环境变量为生产环境
    },
    // 您可以添加更多 PM2 配置项，例如：
    // instances: 'max', // 根据 CPU 核心数启动实例
    // exec_mode: 'cluster', // 使用集群模式
  }]
};