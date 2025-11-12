module.exports = {
  apps: [{
    name: 'rgbasket-api',
    script: './server.js',
    instances: 2, // Use 2 CPU cores
    exec_mode: 'cluster', // Cluster mode for load balancing
    env: {
      PORT: 5000,
      NODE_ENV: 'production'
    },
    env_development: {
      PORT: 5000,
      NODE_ENV: 'development'
    },
    watch: false, // Set to true for auto-restart during development
    ignore_watch: ['node_modules', 'logs'],
    max_memory_restart: '500M', // Auto-restart if memory exceeds 500MB
    log_file: './logs/pm2.log',
    time: true,
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    merge_logs: true
  }]
};