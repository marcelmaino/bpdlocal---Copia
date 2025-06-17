# Script de Deploy para BPD Dashboard (Windows PowerShell)
# Uso: .\deploy.ps1 [ambiente]
# Ambientes: dev, prod

param(
    [string]$Environment = "prod"
)

$ErrorActionPreference = "Stop"

$ComposeFile = "docker-compose.yml"
if ($Environment -eq "prod") {
    $ComposeFile = "docker-compose.prod.yml"
}

Write-Host "🚀 Iniciando deploy para ambiente: $Environment" -ForegroundColor Green
Write-Host "📁 Usando arquivo: $ComposeFile" -ForegroundColor Yellow

# Verificar se o arquivo existe
if (-not (Test-Path $ComposeFile)) {
    Write-Host "❌ Arquivo $ComposeFile não encontrado!" -ForegroundColor Red
    exit 1
}

# Verificar se o Docker está rodando
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker não está rodando!" -ForegroundColor Red
    exit 1
}

# Parar containers existentes
Write-Host "🛑 Parando containers existentes..." -ForegroundColor Yellow
docker-compose -f $ComposeFile down

# Perguntar sobre remoção de imagens antigas
$RemoveImages = Read-Host "🗑️  Remover imagens antigas? (y/N)"
if ($RemoveImages -match "^[Yy]$") {
    Write-Host "🧹 Removendo imagens antigas..." -ForegroundColor Yellow
    docker system prune -f
    docker image prune -f
}

# Build e start dos containers
Write-Host "🔨 Fazendo build das imagens..." -ForegroundColor Yellow
docker-compose -f $ComposeFile build --no-cache

Write-Host "▶️  Iniciando containers..." -ForegroundColor Yellow
docker-compose -f $ComposeFile up -d

# Aguardar containers iniciarem
Write-Host "⏳ Aguardando containers iniciarem..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Verificar status
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker-compose -f $ComposeFile ps

# Verificar logs
Write-Host "📝 Últimos logs:" -ForegroundColor Cyan
docker-compose -f $ComposeFile logs --tail=20

# URLs de acesso
Write-Host ""
Write-Host "✅ Deploy concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 URLs de acesso:" -ForegroundColor Cyan
if ($Environment -eq "prod") {
    Write-Host "   Frontend: http://localhost" -ForegroundColor White
    Write-Host "   Backend API: http://localhost:5000" -ForegroundColor White
    Write-Host "   phpMyAdmin: http://localhost:8080" -ForegroundColor White
} else {
    Write-Host "   Frontend: http://localhost:3001" -ForegroundColor White
    Write-Host "   Backend API: http://localhost:5000" -ForegroundColor White
    Write-Host "   phpMyAdmin: http://localhost:8080" -ForegroundColor White
}
Write-Host ""
Write-Host "📋 Comandos úteis:" -ForegroundColor Cyan
Write-Host "   Ver logs: docker-compose -f $ComposeFile logs -f" -ForegroundColor White
Write-Host "   Parar: docker-compose -f $ComposeFile down" -ForegroundColor White
Write-Host "   Reiniciar: docker-compose -f $ComposeFile restart" -ForegroundColor White
Write-Host "   Status: docker-compose -f $ComposeFile ps" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Deploy finalizado com sucesso!" -ForegroundColor Green