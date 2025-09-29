module.exports = {
  apps: [
    {
      name: 'lorcana-mulligan-trainer',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/lorcana-mulligan-trainer',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Environment variables will be loaded from .env file
      },
      error_file: '/var/log/pm2/lorcana-mulligan-trainer-error.log',
      out_file: '/var/log/pm2/lorcana-mulligan-trainer-out.log',
      log_file: '/var/log/pm2/lorcana-mulligan-trainer-combined.log',
      time: true
    }
  ]
}