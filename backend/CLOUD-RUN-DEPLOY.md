# Despliegue de GateLogix en Google Cloud Run sin Docker

Este documento proporciona instrucciones para desplegar el backend de GateLogix en Google Cloud Run sin necesidad de usar Docker localmente.

## Requisitos previos

1. Tener una cuenta de Google Cloud Platform
2. Tener instalado y configurado Google Cloud SDK (gcloud CLI)
3. Tener habilitada la API de Cloud Run en tu proyecto

## Opciones de despliegue

Existen dos formas principales de desplegar en Cloud Run sin Docker:

### Opción 1: Despliegue directo con gcloud CLI

Esta opción utiliza Cloud Build para construir automáticamente un contenedor a partir de tu código fuente.

1. Abre una terminal PowerShell en el directorio `backend`
2. Edita el archivo `deploy-cloud-run.ps1` y configura tu PROJECT_ID
3. Ejecuta el script de despliegue:

```powershell
.\deploy-cloud-run.ps1
```

### Opción 2: Despliegue desde la consola de Google Cloud

1. Ve a la [consola de Google Cloud](https://console.cloud.google.com/)
2. Navega a Cloud Run
3. Haz clic en "Crear servicio"
4. Selecciona "Implementar una revisión desde un repositorio de código fuente"
5. Conecta tu repositorio de código
6. Configura las siguientes opciones:
   - Puerto: 8080
   - Variables de entorno: 
     - NODE_ENV: production
     - PORT: 8080
   - Memoria: 1 GiB
   - CPU: 1
   - Instancias máximas: 10
   - Instancias mínimas: 1

## Solución de problemas comunes

### Error: El contenedor no escucha en el puerto definido

Este error ocurre cuando Cloud Run no puede conectarse al puerto que espera que tu aplicación esté escuchando.

**Solución**: 
- Verifica que tu aplicación esté escuchando en `0.0.0.0` y no solo en `localhost`
- Asegúrate de que la variable de entorno PORT esté configurada correctamente
- Revisa los logs para ver si hay errores durante el inicio

### Error: Cuota excedida

Este error ocurre cuando intentas configurar más recursos de los permitidos por tu cuota.

**Solución**:
- Reduce el número máximo de instancias a 10 o menos
- Reduce la cantidad de CPU o memoria por instancia
- Solicita un aumento de cuota en la consola de Google Cloud

### Error: Tiempo de inicio excedido

Este error ocurre cuando tu aplicación tarda demasiado en iniciar.

**Solución**:
- Aumenta el tiempo de espera de inicio en la configuración
- Optimiza el proceso de inicio de tu aplicación
- Verifica que no haya operaciones bloqueantes durante el inicio

## Verificación del despliegue

Una vez desplegada la aplicación, puedes verificar su funcionamiento accediendo a la URL proporcionada por Cloud Run. Deberías ver el mensaje "API funcionando" al acceder a la ruta base.

## Monitoreo y logs

Para ver los logs de tu aplicación:

1. Ve a la consola de Google Cloud
2. Navega a Cloud Run
3. Selecciona tu servicio
4. Haz clic en "Logs"

Esto te permitirá ver los mensajes de diagnóstico agregados al código para identificar problemas.