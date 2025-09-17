# Script para desplegar en Google Cloud Run sin Docker

# Asegúrate de tener gcloud CLI instalado y configurado
# https://cloud.google.com/sdk/docs/install

# Variables de configuración
$PROJECT_ID = "tu-proyecto-id" # Reemplaza con tu ID de proyecto
$REGION = "us-central1"        # Región de Google Cloud
$SERVICE_NAME = "gatelogix-backend"

# Mostrar información de configuración
Write-Host "Configuración de despliegue:" -ForegroundColor Cyan
Write-Host "- Proyecto: $PROJECT_ID"
Write-Host "- Región: $REGION"
Write-Host "- Servicio: $SERVICE_NAME"
Write-Host ""

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "./package.json")) {
    Write-Host "Error: Este script debe ejecutarse desde el directorio backend" -ForegroundColor Red
    exit 1
}

# Verificar que el usuario está autenticado en gcloud
Write-Host "Verificando autenticación con Google Cloud..." -ForegroundColor Yellow
gcloud auth list

# Confirmar antes de continuar
Write-Host ""
Write-Host "¿Deseas continuar con el despliegue? (S/N)" -ForegroundColor Yellow
$confirmation = Read-Host
if ($confirmation -ne "S") {
    Write-Host "Despliegue cancelado" -ForegroundColor Red
    exit 0
}

# Desplegar en Cloud Run
Write-Host "Desplegando en Cloud Run..." -ForegroundColor Green

gcloud run deploy $SERVICE_NAME \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 1 \
  --port 8080 \
  --set-env-vars "NODE_ENV=production,PORT=8080" \
  --timeout 300s

# Verificar el resultado
if ($LASTEXITCODE -eq 0) {
    Write-Host "\nDespliegue completado exitosamente!" -ForegroundColor Green
    Write-Host "Puedes verificar el estado de tu servicio en la consola de Google Cloud:"
    Write-Host "https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME/metrics?project=$PROJECT_ID" -ForegroundColor Cyan
} else {
    Write-Host "\nHubo un problema con el despliegue. Revisa los errores anteriores." -ForegroundColor Red
}