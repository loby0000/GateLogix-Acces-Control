# Etapa de build
FROM node:20 AS build
WORKDIR /app

# Copiar package.json y lock
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el proyecto, incluyendo .env.production
COPY . .

# Establecer NODE_ENV en producción
ENV NODE_ENV=production

# Build de Vite usando .env.production
RUN npm run build

# Etapa de producción: Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080

CMD ["/start.sh"]
