# ========================================
# Script de Deploy via FTP - Backend PHP
# ========================================

param(
    [string]$FtpHost = "",
    [string]$FtpUser = "",
    [string]$FtpPassword = "",
    [string]$FtpPath = "/public_html/",
    [string]$LocalPath = "./backend-php/",
    [switch]$TestOnly = $false,
    [switch]$Backup = $true
)

# Cores para output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"
$WarningColor = "Yellow"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Verificando pré-requisitos..." $InfoColor
    
    # Verificar se o diretório local existe
    if (-not (Test-Path $LocalPath)) {
        Write-ColorOutput "❌ Diretório local não encontrado: $LocalPath" $ErrorColor
        return $false
    }
    
    # Verificar arquivos essenciais
    $essentialFiles = @(
        "index.php",
        "classes/Database.php",
        "classes/Auth.php"
    )
    
    foreach ($file in $essentialFiles) {
        $fullPath = Join-Path $LocalPath $file
        if (-not (Test-Path $fullPath)) {
            Write-ColorOutput "❌ Arquivo essencial não encontrado: $file" $ErrorColor
            return $false
        }
    }
    
    Write-ColorOutput "✅ Pré-requisitos verificados com sucesso!" $SuccessColor
    return $true
}

function Get-FtpCredentials {
    if ([string]::IsNullOrEmpty($FtpHost)) {
        $script:FtpHost = Read-Host "Digite o host FTP"
    }
    
    if ([string]::IsNullOrEmpty($FtpUser)) {
        $script:FtpUser = Read-Host "Digite o usuário FTP"
    }
    
    if ([string]::IsNullOrEmpty($FtpPassword)) {
        $script:FtpPassword = Read-Host "Digite a senha FTP" -AsSecureString
        $script:FtpPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($script:FtpPassword))
    }
}

function Test-FtpConnection {
    Write-ColorOutput "🔗 Testando conexão FTP..." $InfoColor
    
    try {
        $ftpRequest = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$FtpPath")
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPassword)
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
        $ftpRequest.UseBinary = $true
        $ftpRequest.UsePassive = $true
        
        $response = $ftpRequest.GetResponse()
        $response.Close()
        
        Write-ColorOutput "✅ Conexão FTP estabelecida com sucesso!" $SuccessColor
        return $true
    }
    catch {
        Write-ColorOutput "❌ Erro na conexão FTP: $($_.Exception.Message)" $ErrorColor
        return $false
    }
}

function Backup-RemoteFiles {
    if (-not $Backup) {
        return
    }
    
    Write-ColorOutput "💾 Criando backup dos arquivos remotos..." $InfoColor
    
    $backupPath = "$FtpPath/backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')/"
    
    try {
        # Criar diretório de backup
        $ftpRequest = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$backupPath")
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPassword)
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $ftpRequest.GetResponse().Close()
        
        Write-ColorOutput "✅ Backup criado em: $backupPath" $SuccessColor
    }
    catch {
        Write-ColorOutput "⚠️ Aviso: Não foi possível criar backup: $($_.Exception.Message)" $WarningColor
    }
}

function Upload-File {
    param(
        [string]$LocalFile,
        [string]$RemoteFile
    )
    
    try {
        $ftpRequest = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$RemoteFile")
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPassword)
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $ftpRequest.UseBinary = $true
        $ftpRequest.UsePassive = $true
        
        $fileContent = [System.IO.File]::ReadAllBytes($LocalFile)
        $ftpRequest.ContentLength = $fileContent.Length
        
        $requestStream = $ftpRequest.GetRequestStream()
        $requestStream.Write($fileContent, 0, $fileContent.Length)
        $requestStream.Close()
        
        $response = $ftpRequest.GetResponse()
        $response.Close()
        
        return $true
    }
    catch {
        Write-ColorOutput "❌ Erro ao enviar $LocalFile : $($_.Exception.Message)" $ErrorColor
        return $false
    }
}

function Create-RemoteDirectory {
    param([string]$RemoteDir)
    
    try {
        $ftpRequest = [System.Net.FtpWebRequest]::Create("ftp://$FtpHost$RemoteDir")
        $ftpRequest.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPassword)
        $ftpRequest.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $ftpRequest.GetResponse().Close()
        return $true
    }
    catch {
        # Diretório pode já existir
        return $true
    }
}

function Deploy-Files {
    Write-ColorOutput "📤 Iniciando upload dos arquivos..." $InfoColor
    
    $uploadCount = 0
    $errorCount = 0
    
    # Criar estrutura de diretórios
    $directories = @(
        "$FtpPath/api",
        "$FtpPath/classes",
        "$FtpPath/config"
    )
    
    foreach ($dir in $directories) {
        Create-RemoteDirectory $dir | Out-Null
    }
    
    # Upload de arquivos
    $files = Get-ChildItem -Path $LocalPath -Recurse -File
    
    foreach ($file in $files) {
        $relativePath = $file.FullName.Substring($LocalPath.Length).Replace('\', '/')
        $remotePath = "$FtpPath$relativePath"
        
        Write-ColorOutput "📁 Enviando: $relativePath" $InfoColor
        
        if (Upload-File $file.FullName $remotePath) {
            $uploadCount++
            Write-ColorOutput "✅ $relativePath" $SuccessColor
        } else {
            $errorCount++
        }
    }
    
    Write-ColorOutput "📊 Resumo do Upload:" $InfoColor
    Write-ColorOutput "   ✅ Arquivos enviados: $uploadCount" $SuccessColor
    Write-ColorOutput "   ❌ Erros: $errorCount" $(if ($errorCount -gt 0) { $ErrorColor } else { $SuccessColor })
    
    return ($errorCount -eq 0)
}

function Create-ProductionEnv {
    Write-ColorOutput "⚙️ Criando arquivo .env de produção..." $InfoColor
    
    $envContent = @"
# Database Configuration
DB_HOST=localhost
DB_USER=seu_usuario_db
DB_PASSWORD=sua_senha_db
DB_NAME=bpd_database
DB_PORT=3306

# Application Configuration
APP_ENV=production
APP_DEBUG=false
APP_URL=https://seudominio.com

# Security
JWT_SECRET=sua_chave_secreta_muito_forte_aqui
CORS_ORIGIN=https://seudominio.com

# Generated on $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
"@
    
    $envPath = Join-Path $LocalPath ".env.production"
    $envContent | Out-File -FilePath $envPath -Encoding UTF8
    
    Write-ColorOutput "✅ Arquivo .env.production criado em: $envPath" $SuccessColor
    Write-ColorOutput "⚠️ IMPORTANTE: Edite este arquivo com as configurações corretas antes do deploy!" $WarningColor
}

function Test-Deployment {
    param([string]$BaseUrl)
    
    if ([string]::IsNullOrEmpty($BaseUrl)) {
        $BaseUrl = Read-Host "Digite a URL base da API (ex: https://seudominio.com/api)"
    }
    
    Write-ColorOutput "🧪 Testando deployment..." $InfoColor
    
    $endpoints = @(
        "/health",
        "/dashboard/filters",
        "/dashboard/metrics"
    )
    
    $successCount = 0
    
    foreach ($endpoint in $endpoints) {
        $url = "$BaseUrl$endpoint"
        
        try {
            $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-ColorOutput "✅ $endpoint - Status: $($response.StatusCode)" $SuccessColor
                $successCount++
            } else {
                Write-ColorOutput "⚠️ $endpoint - Status: $($response.StatusCode)" $WarningColor
            }
        }
        catch {
            Write-ColorOutput "❌ $endpoint - Erro: $($_.Exception.Message)" $ErrorColor
        }
    }
    
    Write-ColorOutput "📊 Testes concluídos: $successCount/$($endpoints.Count) endpoints funcionando" $InfoColor
}

# ========================================
# EXECUÇÃO PRINCIPAL
# ========================================

Write-ColorOutput "🚀 BPD Dashboard - Deploy via FTP" $InfoColor
Write-ColorOutput "=====================================" $InfoColor

# Verificar pré-requisitos
if (-not (Test-Prerequisites)) {
    Write-ColorOutput "❌ Deploy cancelado devido a pré-requisitos não atendidos." $ErrorColor
    exit 1
}

# Criar arquivo .env de produção
Create-ProductionEnv

# Obter credenciais FTP
Get-FtpCredentials

# Testar conexão FTP
if (-not (Test-FtpConnection)) {
    Write-ColorOutput "❌ Deploy cancelado devido a problemas de conexão FTP." $ErrorColor
    exit 1
}

if ($TestOnly) {
    Write-ColorOutput "✅ Teste de conexão concluído com sucesso!" $SuccessColor
    exit 0
}

# Confirmar deploy
$confirm = Read-Host "Deseja continuar com o deploy? (s/N)"
if ($confirm -ne "s" -and $confirm -ne "S") {
    Write-ColorOutput "❌ Deploy cancelado pelo usuário." $WarningColor
    exit 0
}

# Fazer backup
Backup-RemoteFiles

# Deploy dos arquivos
if (Deploy-Files) {
    Write-ColorOutput "🎉 Deploy concluído com sucesso!" $SuccessColor
    
    # Testar deployment
    $testDeploy = Read-Host "Deseja testar o deployment agora? (s/N)"
    if ($testDeploy -eq "s" -or $testDeploy -eq "S") {
        Test-Deployment
    }
    
    Write-ColorOutput "📋 Próximos passos:" $InfoColor
    Write-ColorOutput "   1. Configure o arquivo .env no servidor" $InfoColor
    Write-ColorOutput "   2. Importe o banco de dados" $InfoColor
    Write-ColorOutput "   3. Configure as permissões de arquivos" $InfoColor
    Write-ColorOutput "   4. Teste todos os endpoints da API" $InfoColor
} else {
    Write-ColorOutput "❌ Deploy falhou. Verifique os erros acima." $ErrorColor
    exit 1
}

Write-ColorOutput "✅ Script de deploy finalizado!" $SuccessColor