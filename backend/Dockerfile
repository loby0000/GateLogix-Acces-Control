FROM node:20-slim

# Crear directorio de la aplicación
WORKDIR /app

# Copiar archivos de dependencias (desde backend/)
COPY package*.json ./

# Instalar dependencias sin devDependencies
RUN npm ci --omit=dev

# Copiar el resto del código fuente
COPY . .

# Crear directorio para códigos de barras
RUN mkdir -p /app/src/barcodes && chmod -R 755 /app/src/barcodes

# Exponer el puerto que Cloud Run espera
EXPOSE 8080

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=8080

# Ejecutar como usuario no root
RUN chown -R node:node /app
USER node

# Comando de arranque
CMD ["npm", "start"]
