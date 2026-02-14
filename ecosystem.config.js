module.exports = {
  apps: [
    {
      name: 'link4deal-backend',
      script: './server/index.js',
      cwd: '/home/cto/project/link4deal',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      error_file: '/home/cto/project/link4deal/logs/pm2-error.log',
      out_file: '/home/cto/project/link4deal/logs/pm2-out.log',
      log_file: '/home/cto/project/link4deal/logs/pm2-combined.log',
      time: true,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ],

  deploy: {
    production: {
      user: 'cto',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/link4deal.git',
      path: '/home/cto/project/link4deal',
      'pre-deploy-local': '',
      'post-deploy': 'cd /home/cto/project/link4deal && npm install && npm run build && pm2 reload ecosystem.config.js --env production && sudo systemctl reload nginx'
    }
  }
};
