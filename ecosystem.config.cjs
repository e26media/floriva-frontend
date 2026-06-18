/** PM2 — production Next.js on port 3000 (nginx proxy target) */
module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: __dirname,
      script: 'npm',
      args: 'run start',
      interpreter: 'none',
      instances: 1,
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
