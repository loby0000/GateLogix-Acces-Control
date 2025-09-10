# install-redis.ps1
# Script para instalar Redis en Windows

Write-Host "🚀 Instalando Redis para GateLogix..." -ForegroundColor Green
Write-Host ""

# Verificar si se ejecuta como administrador
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ Este script debe ejecutarse como Administrador" -ForegroundColor Red
    Write-Host "   Haz clic derecho en PowerShell y selecciona 'Ejecutar como administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

# Función para verificar si un comando existe
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Opción 1: Intentar instalar con Chocolatey
Write-Host "🔍 Verificando Chocolatey..." -ForegroundColor Cyan
if (Test-Command choco) {
    Write-Host "✅ Chocolatey encontrado. Instalando Redis..." -ForegroundColor Green
    try {
        choco install redis-64 -y
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Redis instalado correctamente con Chocolatey" -ForegroundColor Green
            Write-Host "🔧 Iniciando servicio Redis..." -ForegroundColor Cyan
            Start-Service redis
            Write-Host "✅ Redis está funcionando" -ForegroundColor Green
            exit 0
        }
    } catch {
        Write-Host "⚠️  Error instalando con Chocolatey, probando alternativas..." -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Chocolatey no encontrado" -ForegroundColor Yellow
}

# Opción 2: Descargar e instalar manualmente
Write-Host "📥 Descargando Redis para Windows..." -ForegroundColor Cyan

$redisVersion = "5.0.14.1"
$downloadUrl = "https://github.com/microsoftarchive/redis/releases/download/win-$redisVersion/Redis-x64-$redisVersion.zip"
$downloadPath = "$env:TEMP\redis.zip"
$extractPath = "C:\Redis"

try {
    # Descargar Redis
    Write-Host "📥 Descargando desde: $downloadUrl" -ForegroundColor Cyan
    Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
    
    # Crear directorio de instalación
    if (Test-Path $extractPath) {
        Remove-Item $extractPath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $extractPath -Force | Out-Null
    
    # Extraer archivos
    Write-Host "📂 Extrayendo archivos a $extractPath..." -ForegroundColor Cyan
    Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
    
    # Añadir Redis al PATH
    Write-Host "🔧 Configurando variables de entorno..." -ForegroundColor Cyan
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($currentPath -notlike "*$extractPath*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$extractPath", "Machine")
        Write-Host "✅ Redis añadido al PATH del sistema" -ForegroundColor Green
    }
    
    # Crear archivo de configuración básico
    $configContent = @"
# Configuración básica de Redis para GateLogix
port 6379
bind 127.0.0.1
timeout 0
tcp-keepalive 300
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir ./
maxmemory-policy allkeys-lru
"@
    
    $configPath = "$extractPath\redis.conf"
    $configContent | Out-File -FilePath $configPath -Encoding UTF8
    Write-Host "✅ Archivo de configuración creado: $configPath" -ForegroundColor Green
    
    # Crear script de inicio
    $startScript = @"
@echo off
echo 🚀 Iniciando Redis para GateLogix...
cd /d "$extractPath"
redis-server.exe redis.conf
"@
    
    $startScriptPath = "$extractPath\start-redis.bat"
    $startScript | Out-File -FilePath $startScriptPath -Encoding ASCII
    Write-Host "✅ Script de inicio creado: $startScriptPath" -ForegroundColor Green
    
    # Limpiar archivo temporal
    Remove-Item $downloadPath -Force
    
    Write-Host "" -ForegroundColor Green
    Write-Host "🎉 ¡Redis instalado correctamente!" -ForegroundColor Green
    Write-Host "" -ForegroundColor Green
    Write-Host "📋 Instrucciones:" -ForegroundColor Cyan
    Write-Host "   1. Reinicia tu terminal/PowerShell para cargar el PATH" -ForegroundColor White
    Write-Host "   2. Para iniciar Redis manualmente: redis-server" -ForegroundColor White
    Write-Host "   3. O ejecuta: $startScriptPath" -ForegroundColor White
    Write-Host "   4. Para probar: redis-cli ping" -ForegroundColor White
    Write-Host "" -ForegroundColor Green
    Write-Host "🔧 Configuración:" -ForegroundColor Cyan
    Write-Host "   - Puerto: 6379" -ForegroundColor White
    Write-Host "   - Host: localhost" -ForegroundColor White
    Write-Host "   - Configuración: $configPath" -ForegroundColor White
    Write-Host "" -ForegroundColor Green
    
    # Preguntar si quiere iniciar Redis ahora
    $startNow = Read-Host "¿Quieres iniciar Redis ahora? (s/n)"
    if ($startNow -eq 's' -or $startNow -eq 'S' -or $startNow -eq 'y' -or $startNow -eq 'Y') {
        Write-Host "🚀 Iniciando Redis..." -ForegroundColor Cyan
        Start-Process -FilePath $startScriptPath
        Write-Host "✅ Redis iniciado en una nueva ventana" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Error durante la instalación: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "" -ForegroundColor Red
    Write-Host "🔧 Alternativas:" -ForegroundColor Yellow
    Write-Host "   1. Instalar Docker y usar: docker run -d -p 6379:6379 redis" -ForegroundColor White
    Write-Host "   2. Usar Redis en la nube (Redis Cloud, AWS ElastiCache)" -ForegroundColor White
    Write-Host "   3. El sistema funcionará sin Redis (sin caché)" -ForegroundColor White
    exit 1
}

Write-Host "" -ForegroundColor Green
Write-Host "✅ Instalación completada. ¡GateLogix está listo para usar Redis!" -ForegroundColor Green
pause