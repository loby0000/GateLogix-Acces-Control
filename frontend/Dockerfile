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

# Cloud Run ignora EXPOSE, pero lo dejamos como documentación
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
