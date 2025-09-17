# Solución al Error de Contenedor en Cloud Run

## Problema Identificado

El error mostrado en las imágenes indica:

> "The user-provided container failed to start and listen on the port defined provided by the PORT=3000 environment variable. This can happen if the container failed to start or if the application failed to bind to the port."

## Causas del Problema

1. **Puerto incorrecto**: La aplicación estaba configurada para escuchar en el puerto 3000, pero Cloud Run espera que la aplicación escuche en el puerto definido por la variable de entorno PORT.

2. **Tiempo de inicio insuficiente**: El tiempo de espera para la verificación de salud era demasiado corto.

3. **Configuración incorrecta del contenedor**: El Dockerfile no estaba configurado correctamente para exponer el puerto adecuado.

## Solución Implementada

Se han creado varios archivos de configuración para solucionar este problema:

### 1. Modificación del código fuente

Se ha modificado `backend/src/index.js` para:
- Cambiar el puerto predeterminado de 3000 a 8080 (puerto estándar de Cloud Run)
- Asegurar que la aplicación escuche en todas las interfaces (0.0.0.0)
- Mejorar los mensajes de log para entornos de producción

### 2. Configuración de Docker

Se ha creado un `Dockerfile` que:
- Expone correctamente el puerto 8080
- Configura las variables de entorno necesarias
- Utiliza un usuario no root por seguridad
- Crea los directorios necesarios con los permisos adecuados

### 3. Configuración de Cloud Build

Se han creado archivos de configuración para Cloud Build que:
- Configuran correctamente el puerto en el servicio de Cloud Run
- Establecen tiempos de espera adecuados para la inicialización
- Configuran pruebas de salud para verificar el funcionamiento

### 4. Scripts de Despliegue

Se han creado scripts para facilitar el despliegue y la configuración de secretos:
- `deploy-cloud-run.ps1`: Script para desplegar la aplicación
- `setup-cloud-secrets.ps1`: Script para configurar los secretos necesarios

## Pasos para Implementar la Solución

1. **Configurar secretos**:
   ```powershell
   ./setup-cloud-secrets.ps1
   ```

2. **Desplegar la aplicación**:
   ```powershell
   ./deploy-cloud-run.ps1
   ```

3. **Verificar el despliegue**:
   - Seleccionar la opción 3 en el script de despliegue para verificar el estado del servicio
   - Comprobar los logs con la opción 4 si hay problemas

## Recomendaciones Adicionales

1. **Monitoreo**: Configurar alertas en Cloud Monitoring para detectar problemas de disponibilidad

2. **Escalado**: Ajustar la configuración de escalado automático según las necesidades de tráfico

3. **Seguridad**: Revisar regularmente los permisos y secretos configurados

4. **Optimización de costos**: Configurar el escalado a cero instancias cuando no hay tráfico

## Recursos Adicionales

- [Documentación oficial de Cloud Run](https://cloud.google.com/run/docs)
- [Solución de problemas en Cloud Run](https://cloud.google.com/run/docs/troubleshooting)
- [Mejores prácticas para contenedores en Cloud Run](https://cloud.google.com/run/docs/tips)