# ================================
# DOCKERFILE PRINCIPAL - GATELOGIX
# ================================
# Este Dockerfile construye tanto el backend como el frontend
# desde la raíz del proyecto usando multi-stage builds

# ================================
# ETAPA 1: BUILD DEL FRONTEND
# ================================
FROM node:20 AS frontend-build

WORKDIR /app/frontend

# Copiar archivos de dependencias del frontend
COPY frontend/package*.json ./

# Instalar dependencias del frontend
RUN npm install

# Copiar código fuente del frontend
COPY frontend/ ./

# Establecer NODE_ENV en producción
ENV NODE_ENV=production

# Build del frontend con Vite
RUN npm run build

# ================================
# ETAPA 2: BUILD DEL BACKEND
# ================================
FROM node:18-slim AS backend-build

WORKDIR /app/backend

# Copiar archivos de dependencias del backend
COPY backend/package*.json ./

# Instalar dependencias del backend (solo producción)
RUN npm ci --omit=dev

# Copiar código fuente del backend
COPY backend/ ./

# Crear directorio para códigos de barras
RUN mkdir -p /app/backend/src/barcodes && chmod -R 755 /app/backend/src/barcodes

# ================================
# ETAPA 3: IMAGEN FINAL CON NGINX + NODE
# ================================
FROM nginx:alpine AS production

# Instalar Node.js en la imagen de nginx
RUN apk add --no-cache nodejs npm

# Crear directorios de trabajo
WORKDIR /app

# Copiar el frontend construido a nginx
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html

# Copiar configuración de nginx del frontend
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar el backend construido
COPY --from=backend-build /app/backend /app/backend

# Copiar script de inicio del frontend
COPY frontend/start.sh /start-frontend.sh
RUN chmod +x /start-frontend.sh

# Crear script de inicio combinado
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'echo "🚀 Iniciando GateLogix - Frontend + Backend"' >> /start.sh && \
    echo 'echo "📦 Iniciando Backend en puerto 8080..."' >> /start.sh && \
    echo 'cd /app/backend && npm start &' >> /start.sh && \
    echo 'echo "🌐 Iniciando Frontend con Nginx en puerto 80..."' >> /start.sh && \
    echo 'nginx -g "daemon off;" &' >> /start.sh && \
    echo 'echo "✅ GateLogix iniciado correctamente"' >> /start.sh && \
    echo 'wait' >> /start.sh && \
    chmod +x /start.sh

# Variables de entorno para el backend
ENV NODE_ENV=production
ENV PORT=8080

# Crear usuario no root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001 && \
    chown -R nextjs:nodejs /app

# Exponer puertos
EXPOSE 80 8080

# Cambiar a usuario no root
USER nextjs

# Comando de inicio
CMD ["/start.sh"]