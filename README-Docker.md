# 🐳 GateLogix - Configuración Docker

Este documento explica cómo usar Docker para ejecutar GateLogix con todos sus servicios.

## 📋 Requisitos Previos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Al menos 4GB de RAM disponible
- Puertos 80, 8080, 27017, 6379 disponibles

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar las variables según tu entorno
nano .env
```

### 2. Ejecutar con Docker Compose (Recomendado)

```bash
# Construir e iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Detener todos los servicios
docker-compose down
```

### 3. Ejecutar con Dockerfile Principal

```bash
# Construir la imagen
docker build -t gatelogix .

# Ejecutar el contenedor
docker run -d \
  --name gatelogix \
  -p 80:80 \
  -p 8080:8080 \
  gatelogix
```

## 🏗️ Arquitectura de Contenedores

### Servicios Incluidos

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| **Frontend** | 80 | Interfaz web con Nginx |
| **Backend** | 8080 | API REST con Node.js |
| **MongoDB** | 27017 | Base de datos principal |
| **Redis** | 6379 | Cache y sesiones |
| **Nginx Proxy** | 443, 8443 | Proxy reverso (opcional) |

### Volúmenes Persistentes

- `mongo-data`: Datos de MongoDB
- `redis-data`: Datos de Redis
- `backend-barcodes`: Códigos de barras generados

## 🔧 Comandos Útiles

### Gestión de Servicios

```bash
# Iniciar servicios específicos
docker-compose up -d backend frontend

# Reiniciar un servicio
docker-compose restart backend

# Ver estado de servicios
docker-compose ps

# Ver logs de un servicio específico
docker-compose logs -f backend
```

### Desarrollo y Debugging

```bash
# Ejecutar comando en contenedor
docker-compose exec backend npm run dev

# Acceder al shell del contenedor
docker-compose exec backend sh

# Ver logs de construcción
docker-compose build --no-cache backend
```

### Mantenimiento

```bash
# Limpiar contenedores parados
docker container prune

# Limpiar imágenes no utilizadas
docker image prune

# Limpiar todo (¡CUIDADO!)
docker system prune -a
```

## 🌐 URLs de Acceso

Después de iniciar los servicios:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:8080
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379

## 🔒 Configuración de Producción

### Variables de Entorno Importantes

```env
# Seguridad
JWT_SECRET=tu-clave-super-secreta-de-produccion
MONGO_ROOT_PASSWORD=password-seguro-mongo
REDIS_PASSWORD=password-seguro-redis

# URLs de producción
VITE_API_URL=https://tu-dominio.com/api
CORS_ORIGIN=https://tu-dominio.com
```

### Usar Nginx Proxy (Producción)

```bash
# Activar perfil de producción
docker-compose --profile production up -d
```

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Puerto ocupado**
   ```bash
   # Verificar puertos en uso
   netstat -tulpn | grep :8080
   
   # Cambiar puerto en docker-compose.yml
   ports:
     - "8081:8080"  # Usar puerto 8081 en lugar de 8080
   ```

2. **Falta de memoria**
   ```bash
   # Verificar uso de memoria
   docker stats
   
   # Limpiar contenedores no utilizados
   docker system prune
   ```

3. **Problemas de conexión entre servicios**
   ```bash
   # Verificar red de Docker
   docker network ls
   docker network inspect gatelogix_gatelogix-network
   ```

### Logs de Debugging

```bash
# Ver todos los logs
docker-compose logs

# Logs específicos con timestamps
docker-compose logs -f -t backend

# Últimas 100 líneas
docker-compose logs --tail=100 frontend
```

## 📊 Monitoreo de Salud

Los servicios incluyen health checks automáticos:

```bash
# Ver estado de salud
docker-compose ps

# Verificar health check manualmente
docker-compose exec backend curl -f http://localhost:8080/api/health
```

## 🔄 Actualizaciones

```bash
# Actualizar imágenes
docker-compose pull

# Reconstruir servicios
docker-compose build --no-cache

# Aplicar cambios
docker-compose up -d
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker-compose logs`
2. Verifica la configuración: `docker-compose config`
3. Consulta la documentación del proyecto
4. Reporta issues en el repositorio

---

**¡GateLogix está listo para funcionar con Docker! 🚀**