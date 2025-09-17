# Despliegue de GateLogix en Google Cloud Run

## Solución al problema de despliegue

El error "container failed to start and listen on the port defined" se ha solucionado mediante las siguientes configuraciones:

1. **Configuración del puerto correcto**: Se ha modificado la aplicación para escuchar en el puerto 8080 (puerto estándar de Cloud Run)
2. **Configuración de variables de entorno**: Se ha asegurado que PORT=8080 esté configurado tanto en el Dockerfile como en la configuración de Cloud Run
3. **Configuración de healthchecks**: Se han añadido pruebas de salud para verificar que la aplicación esté funcionando correctamente

## Archivos de configuración creados

- `cloudbuild.yaml`: Configuración principal para Cloud Build
- `backend/cloudbuild.yaml`: Configuración específica para el backend
- `backend/Dockerfile`: Configuración del contenedor Docker
- `backend/.dockerignore`: Archivos a ignorar en la construcción del contenedor
- `backend/service.yaml`: Configuración del servicio en Cloud Run

## Pasos para desplegar

### 1. Configurar secretos en Google Cloud

```bash
# Crear secreto para MongoDB
gcloud secrets create mongodb-credentials --data-file=mongodb-credentials.json

# Dar acceso al servicio
gcloud secrets add-iam-policy-binding mongodb-credentials \
    --member="serviceAccount:YOUR-SERVICE-ACCOUNT@YOUR-PROJECT.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 2. Desplegar usando Cloud Build

```bash
# Desde la raíz del proyecto
gcloud builds submit --config=cloudbuild.yaml \
    --substitutions=_MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/gatelogix",_SERVICE_ACCOUNT="your-service-account@your-project.iam.gserviceaccount.com"
```

### 3. Desplegar solo el backend (alternativa)

```bash
# Desde la carpeta backend
cd backend
gcloud builds submit --config=cloudbuild.yaml \
    --substitutions=_MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/gatelogix",_SERVICE_ACCOUNT="your-service-account@your-project.iam.gserviceaccount.com"
```

## Verificación del despliegue

Una vez desplegado, puedes verificar el estado del servicio con:

```bash
gcloud run services describe gatelogix --region=northamerica-south1
```

## Solución de problemas comunes

### Error de puerto

Si persiste el error "container failed to start and listen on the port defined":

1. Verifica que el puerto configurado en el código (PORT=8080) coincida con el puerto expuesto en el Dockerfile y en la configuración de Cloud Run
2. Asegúrate de que la aplicación esté escuchando en 0.0.0.0 y no solo en localhost
3. Revisa los logs de Cloud Run para identificar posibles errores durante el inicio

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=gatelogix" --limit=50
```

### Error de conexión a MongoDB

Si la aplicación no puede conectarse a MongoDB:

1. Verifica que la variable de entorno MONGODB_URI esté correctamente configurada
2. Asegúrate de que la IP del servicio de Cloud Run esté en la lista blanca de MongoDB Atlas
3. Verifica que las credenciales sean correctas

### Tiempo de inicio prolongado

Si la aplicación tarda demasiado en iniciar:

1. Optimiza las dependencias en package.json
2. Considera usar una imagen base más ligera en el Dockerfile
3. Implementa estrategias de caché para reducir el tiempo de inicio