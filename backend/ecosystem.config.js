// ecosystem.config.js - Configuración PM2 para producción

module.exports = {
  apps: [{
    name: 'gatelogix-backend',
    script: 'src/index.js',
    
    // Configuración de instancias para alta concurrencia
    instances: 'max', // Usar todos los cores disponibles
    exec_mode: 'cluster',
    
    // Variables de entorno
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGODB_URI: 'mongodb://localhost:27017/gatelogix',
      JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key'
    },
    
    // Configuración de memoria y CPU
    max_memory_restart: '1G', // Reiniciar si usa más de 1GB
    node_args: '--max-old-space-size=2048', // 2GB heap para Node.js
    
    // Configuración de logs
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Configuración de reinicio automático
    autorestart: true,
    watch: false, // Deshabilitado en producción
    max_restarts: 10,
    min_uptime: '10s',
    
    // Configuración de clustering
    listen_timeout: 8000,
    kill_timeout: 5000,
    
    // Configuración de monitoreo
    pmx: true,
    
    // Scripts de lifecycle
    post_update: ['npm install', 'npm run setup-optimization'],
    
    // Configuración específica para 200K usuarios
    instance_var: 'INSTANCE_ID',
    
    // Configuración de cron jobs (opcional)
    cron_restart: '0 2 * * *', // Reiniciar a las 2 AM diariamente
    
    // Configuración de merge logs
    merge_logs: true,
    
    // Configuración de source map
    source_map_support: true,
    
    // Configuración de graceful shutdown
    shutdown_with_message: true,
    wait_ready: true,
    
    // Variables específicas para optimización
    env_vars: {
      UV_THREADPOOL_SIZE: 128, // Aumentar thread pool para I/O
      NODE_OPTIONS: '--max-old-space-size=2048 --optimize-for-size'
    }
  }],
  
  // Configuración de deployment
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/gatelogix.git',
      path: '/var/www/gatelogix',
      'post-deploy': 'npm install && npm run setup-optimization && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    }
  },
  
  // Configuración de monitoreo
  monitoring: {
    http: true,
    https: false,
    port: 9615,
    
    // Métricas personalizadas
    custom_metrics: {
      'Active Users': () => {
        // Lógica para contar usuarios activos
        return Math.floor(Math.random() * 1000);
      },
      'Database Connections': () => {
        // Lógica para contar conexiones DB
        return Math.floor(Math.random() * 50);
      },
      'Cache Hit Rate': () => {
        // Lógica para obtener hit rate del cache
        return Math.floor(Math.random() * 100);
      }
    }
  }
};

// Configuración adicional para desarrollo
if (process.env.NODE_ENV === 'development') {
  module.exports.apps[0].instances = 1;
  module.exports.apps[0].exec_mode = 'fork';
  module.exports.apps[0].watch = true;
  module.exports.apps[0].ignore_watch = ['node_modules', 'logs', '*.log'];
}

// Configuración para testing
if (process.env.NODE_ENV === 'test') {
  module.exports.apps[0].instances = 1;
  module.exports.apps[0].exec_mode = 'fork';
  module.exports.apps[0].env.PORT = 3001;
}