# Script para configurar secretos en Google Cloud para GateLogix (PowerShell)

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

# Función para crear secreto de MongoDB
function Create-MongoDBSecret {
    Write-ColorOutput Cyan "\nCreando secreto para MongoDB..."
    
    # Solicitar URI de MongoDB
    $MONGODB_URI = Read-Host "Ingresa la URI de MongoDB (ejemplo: mongodb+srv://usuario:contraseña@cluster.mongodb.net/gatelogix)"
    
    if ([string]::IsNullOrEmpty($MONGODB_URI)) {
        Write-ColorOutput Red "✗ URI de MongoDB no proporcionada. Abortando."
        return
    }
    
    # Crear archivo temporal
    $tempFile = [System.IO.Path]::GetTempFileName()
    
    # Escribir URI en archivo temporal
    Set-Content -Path $tempFile -Value $MONGODB_URI
    
    # Crear secreto
    Write-ColorOutput Yellow "Creando secreto 'mongodb-credentials'..."
    gcloud secrets create mongodb-credentials --data-file=$tempFile
    
    # Eliminar archivo temporal
    Remove-Item -Path $tempFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✓ Secreto 'mongodb-credentials' creado con éxito"
    } else {
        Write-ColorOutput Red "✗ Error al crear el secreto 'mongodb-credentials'"
    }
}

# Función para asignar permisos al secreto
function Assign-SecretPermissions {
    Write-ColorOutput Cyan "\nAsignando permisos al secreto..."
    
    # Solicitar cuenta de servicio
    $SERVICE_ACCOUNT = Read-Host "Ingresa la cuenta de servicio (ejemplo: gatelogix-sa@$PROJECT_ID.iam.gserviceaccount.com)"
    
    if ([string]::IsNullOrEmpty($SERVICE_ACCOUNT)) {
        Write-ColorOutput Red "✗ Cuenta de servicio no proporcionada. Abortando."
        return
    }
    
    # Asignar permisos
    Write-ColorOutput Yellow "Asignando permisos a la cuenta de servicio $SERVICE_ACCOUNT..."
    gcloud secrets add-iam-policy-binding mongodb-credentials `
        --member="serviceAccount:$SERVICE_ACCOUNT" `
        --role="roles/secretmanager.secretAccessor"
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✓ Permisos asignados con éxito"
    } else {
        Write-ColorOutput Red "✗ Error al asignar permisos"
    }
}

# Función para crear cuenta de servicio
function Create-ServiceAccount {
    Write-ColorOutput Cyan "\nCreando cuenta de servicio..."
    
    # Solicitar nombre de la cuenta de servicio
    $SA_NAME = Read-Host "Ingresa el nombre para la cuenta de servicio (ejemplo: gatelogix-sa)"
    
    if ([string]::IsNullOrEmpty($SA_NAME)) {
        Write-ColorOutput Red "✗ Nombre de cuenta de servicio no proporcionado. Abortando."
        return
    }
    
    # Crear cuenta de servicio
    Write-ColorOutput Yellow "Creando cuenta de servicio $SA_NAME..."
    gcloud iam service-accounts create $SA_NAME `
        --display-name="GateLogix Service Account"
    
    if ($LASTEXITCODE -eq 0) {
        $fullSA = "$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
        Write-ColorOutput Green "✓ Cuenta de servicio creada con éxito: $fullSA"
        
        # Asignar roles necesarios
        Write-ColorOutput Yellow "Asignando roles necesarios..."
        gcloud projects add-iam-policy-binding $PROJECT_ID `
            --member="serviceAccount:$fullSA" `
            --role="roles/run.admin"
        
        gcloud projects add-iam-policy-binding $PROJECT_ID `
            --member="serviceAccount:$fullSA" `
            --role="roles/secretmanager.secretAccessor"
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "✓ Roles asignados con éxito"
        } else {
            Write-ColorOutput Red "✗ Error al asignar roles"
        }
        
        return $fullSA
    } else {
        Write-ColorOutput Red "✗ Error al crear la cuenta de servicio"
        return $null
    }
}

# Menú de opciones
function Show-Menu {
    Write-ColorOutput Cyan "\n=== CONFIGURACIÓN DE SECRETOS PARA GATELOGIX ==="
    Write-ColorOutput Cyan "1. Crear cuenta de servicio"
    Write-ColorOutput Cyan "2. Crear secreto para MongoDB"
    Write-ColorOutput Cyan "3. Asignar permisos al secreto"
    Write-ColorOutput Cyan "4. Configurar todo (pasos 1-3)"
    Write-ColorOutput Cyan "5. Salir"
    Write-ColorOutput Cyan "Selecciona una opción: " -NoNewline
    return Read-Host
}

# Función para configurar todo
function Configure-All {
    Write-ColorOutput Cyan "\nConfigurando todos los secretos y permisos..."
    
    # Crear cuenta de servicio
    $serviceAccount = Create-ServiceAccount
    
    if ($serviceAccount) {
        # Crear secreto de MongoDB
        Create-MongoDBSecret
        
        # Asignar permisos automáticamente
        Write-ColorOutput Yellow "Asignando permisos a la cuenta de servicio $serviceAccount..."
        gcloud secrets add-iam-policy-binding mongodb-credentials `
            --member="serviceAccount:$serviceAccount" `
            --role="roles/secretmanager.secretAccessor"
        
        if ($LASTEXITCODE -eq 0) {
            Write-ColorOutput Green "✓ Configuración completada con éxito"
        } else {
            Write-ColorOutput Red "✗ Error en la configuración"
        }
    }
}

# Bucle principal
$option = 0
$serviceAccount = $null

while ($option -ne 5) {
    $option = Show-Menu
    switch ($option) {
        1 { $serviceAccount = Create-ServiceAccount }
        2 { Create-MongoDBSecret }
        3 { Assign-SecretPermissions }
        4 { Configure-All }
        5 { Write-ColorOutput Yellow "Saliendo..." }
        default { Write-ColorOutput Red "Opción no válida" }
    }
}