# Etapa de build
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Etapa de producción
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Cloud Run ignora EXPOSE, solo documentación
EXPOSE 8080

# Usar el script para arrancar Nginx en el puerto de Cloud Run
CMD ["/start.sh"]
