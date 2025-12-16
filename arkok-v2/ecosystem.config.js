module.exports = {
  apps: [{
    name: "arkok-v2",
    script: "npm",
    args: "run start",
    cwd: "/home/devbox/project/arkok-v2/server",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    log_file: "/home/devbox/project/arkok-v2/logs/combined.log",
    out_file: "/home/devbox/project/arkok-v2/logs/out.log",
    error_file: "/home/devbox/project/arkok-v2/logs/error.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    kill_timeout: 5000,
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: "10s"
  }]
};