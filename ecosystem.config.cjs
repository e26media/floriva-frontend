/** PM2 config — run: pm2 start ecosystem.config.cjs */
module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3000',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_restarts: 20,
      min_uptime: '5s',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
};
