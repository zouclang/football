module.exports = {
  apps: [
    {
      name: 'football-app',
      // Next.js standalone 模式的启动入口
      script: 'server.js',
      // 启动目录指向 standalone
      cwd: './.next/standalone',
      instances: 1,
      autorestart: true,
      watch: false,
      // 内存占用过高时自动重启，防止死机
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
        // 请在此处填写你的真实密码，并在部署时修改
        ADMIN_PASSWORD: 'your_admin_password',
        PLAYER_PASSWORD: 'your_player_password',
        // standalone 目录向上两层找到项目根目录下的 data/dev.db
        DATABASE_URL: 'file:../../data/dev.db'
      },
    },
  ],
};
