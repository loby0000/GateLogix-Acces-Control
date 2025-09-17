# Script de despliegue para GateLogix en Cloud Run (PowerShell)

# Configuración
$PROJECT_ID = "gatelogix-access-control" # Cambiar por el ID de tu proyecto
$REGION = "northamerica-south1"
$SERVICE_NAME = "gatelogix"

# Colores para mensajes
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Verificar que gcloud está instalado
try {
    $gcloudVersion = gcloud --version
    Write-ColorOutput Green "✓ Google Cloud SDK encontrado"
} catch {
    Write-ColorOutput Red "✗ Google Cloud SDK no encontrado. Por favor instálalo desde: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Verificar autenticación
Write-ColorOutput Cyan "Verificando autenticación con Google Cloud..."
$account = gcloud auth list --filter=status:ACTIVE --format="value(account)"
if ($account) {
    Write-ColorOutput Green "✓ Autenticado como: $account"
} else {
    Write-ColorOutput Yellow "! No autenticado. Iniciando proceso de autenticación..."
    gcloud auth login
}

# Verificar proyecto activo
$currentProject = gcloud config get-value project
Write-ColorOutput Cyan "Proyecto actual: $currentProject"
if ($currentProject -ne $PROJECT_ID) {
    Write-ColorOutput Yellow "! Cambiando al proyecto $PROJECT_ID"
    gcloud config set project $PROJECT_ID
}

# Menú de opciones
function Show-Menu {
    Write-ColorOutput Cyan "\n=== DESPLIEGUE DE GATELOGIX EN CLOUD RUN ==="
    Write-ColorOutput Cyan "1. Desplegar aplicación completa"
    Write-ColorOutput Cyan "2. Desplegar solo backend"
    Write-ColorOutput Cyan "3. Verificar estado del servicio"
    Write-ColorOutput Cyan "4. Ver logs del servicio"
    Write-ColorOutput Cyan "5. Salir"
    Write-ColorOutput Cyan "Selecciona una opción: " -NoNewline
    return Read-Host
}

# Función para desplegar la aplicación completa
function Deploy-FullApp {
    Write-ColorOutput Cyan "\nDesplegando aplicación completa..."
    
    # Solicitar URI de MongoDB si no está configurada
    $MONGODB_URI = Read-Host "Ingresa la URI de MongoDB (o presiona Enter para omitir)"
    if ([string]::IsNullOrEmpty($MONGODB_URI)) {
        $MONGODB_URI = "\${_MONGODB_URI}"
    }
    
    # Solicitar cuenta de servicio
    $SERVICE_ACCOUNT = Read-Host "Ingresa la cuenta de servicio (o presiona Enter para omitir)"
    if ([string]::IsNullOrEmpty($SERVICE_ACCOUNT)) {
        $SERVICE_ACCOUNT = "\${_SERVICE_ACCOUNT}"
    }
    
    # Ejecutar Cloud Build
    Write-ColorOutput Yellow "Iniciando despliegue con Cloud Build..."
    gcloud builds submit --config=cloudbuild.yaml `
        --substitutions=_MONGODB_URI="$MONGODB_URI",_SERVICE_ACCOUNT="$SERVICE_ACCOUNT"
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✓ Despliegue completado con éxito"
    } else {
        Write-ColorOutput Red "✗ Error en el despliegue"
    }
}

# Función para desplegar solo el backend
function Deploy-Backend {
    Write-ColorOutput Cyan "\nDesplegando solo el backend..."
    
    # Verificar que estamos en la carpeta correcta
    if (-not (Test-Path "backend\cloudbuild.yaml")) {
        Write-ColorOutput Red "✗ No se encontró el archivo backend\cloudbuild.yaml"
        return
    }
    
    # Solicitar URI de MongoDB si no está configurada
    $MONGODB_URI = Read-Host "Ingresa la URI de MongoDB (o presiona Enter para omitir)"
    if ([string]::IsNullOrEmpty($MONGODB_URI)) {
        $MONGODB_URI = "\${_MONGODB_URI}"
    }
    
    # Solicitar cuenta de servicio
    $SERVICE_ACCOUNT = Read-Host "Ingresa la cuenta de servicio (o presiona Enter para omitir)"
    if ([string]::IsNullOrEmpty($SERVICE_ACCOUNT)) {
        $SERVICE_ACCOUNT = "\${_SERVICE_ACCOUNT}"
    }
    
    # Ejecutar Cloud Build para el backend
    Write-ColorOutput Yellow "Iniciando despliegue del backend con Cloud Build..."
    Set-Location -Path "backend"
    gcloud builds submit --config=cloudbuild.yaml `
        --substitutions=_MONGODB_URI="$MONGODB_URI",_SERVICE_ACCOUNT="$SERVICE_ACCOUNT"
    Set-Location -Path ".."
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✓ Despliegue del backend completado con éxito"
    } else {
        Write-ColorOutput Red "✗ Error en el despliegue del backend"
    }
}

# Función para verificar el estado del servicio
function Check-ServiceStatus {
    Write-ColorOutput Cyan "\nVerificando estado del servicio $SERVICE_NAME..."
    gcloud run services describe $SERVICE_NAME --region=$REGION
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "\n✓ Servicio verificado correctamente"
        $url = gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"
        Write-ColorOutput Green "URL del servicio: $url"
    } else {
        Write-ColorOutput Red "✗ Error al verificar el servicio"
    }
}

# Función para ver los logs del servicio
function View-ServiceLogs {
    Write-ColorOutput Cyan "\nObteniendo logs del servicio $SERVICE_NAME..."
    $lines = Read-Host "Número de líneas a mostrar (predeterminado: 50)"
    if ([string]::IsNullOrEmpty($lines)) {
        $lines = 50
    }
    
    gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" --limit=$lines
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "\n✓ Logs obtenidos correctamente"
    } else {
        Write-ColorOutput Red "✗ Error al obtener los logs"
    }
}

# Bucle principal
$option = 0
while ($option -ne 5) {
    $option = Show-Menu
    switch ($option) {
        1 { Deploy-FullApp }
        2 { Deploy-Backend }
        3 { Check-ServiceStatus }
        4 { View-ServiceLogs }
        5 { Write-ColorOutput Yellow "Saliendo..." }
        default { Write-ColorOutput Red "Opción no válida" }
    }
}