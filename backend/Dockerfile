FROM node:18-slim

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Crear directorio para códigos de barras si no existe
RUN mkdir -p /app/src/barcodes && chmod -R 755 /app/src/barcodes

# Exponer puerto (debe coincidir con el puerto en cloudbuild.yaml)
EXPOSE 8080

# Configurar variables de entorno
ENV NODE_ENV=production
ENV PORT=8080

# Ejecutar como usuario no root
RUN chown -R node:node /app
USER node

# Comando para iniciar la aplicación
CMD ["node", "src/index.js"]