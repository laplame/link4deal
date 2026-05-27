const path = require('path');

/** Raíz del repo (donde está este archivo). Funciona aunque no sea /home/cto/project/link4deal. */
const projectRoot = path.resolve(__dirname);
const logsDir = path.join(projectRoot, 'logs');

module.exports = {
  apps: [
    {
      name: 'link4deal-backend',
      script: path.join(projectRoot, 'server', 'index.js'),
      cwd: projectRoot,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001,
      },
      error_file: path.join(logsDir, 'pm2-error.log'),
      out_file: path.join(logsDir, 'pm2-out.log'),
      log_file: path.join(logsDir, 'pm2-combined.log'),
      time: true,
      restart_delay: 4000,
      max_restarts: 15,
      min_uptime: '10s',
      exp_backoff_restart_delay: 2000,
    },
  ],

  deploy: {
    production: {
      user: 'cto',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/link4deal.git',
      path: projectRoot,
      'pre-deploy-local': '',
      'post-deploy': `cd ${projectRoot} && npm install && npm run build && pm2 reload ecosystem.config.cjs --env production && sudo systemctl reload nginx`,
    },
  },
};
