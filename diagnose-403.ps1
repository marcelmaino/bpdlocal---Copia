# ========================================
# Script de Diagnóstico 403 Forbidden
# ========================================

param(
    [string]$BaseUrl = "",
    [switch]$Detailed = $false,
    [switch]$CreateTestFiles = $false
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

function Get-BaseUrl {
    if ([string]::IsNullOrEmpty($BaseUrl)) {
        $script:BaseUrl = Read-Host "Digite a URL do seu site (ex: https://seudominio.com)"
        # Remover barra final se existir
        $script:BaseUrl = $script:BaseUrl.TrimEnd('/')
    }
}

function Test-HttpRequest {
    param(
        [string]$Url,
        [string]$Description = "",
        [string]$Method = "GET",
        [hashtable]$Headers = @{}
    )
    
    $testName = if ($Description) { $Description } else { $Url }
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 30
            UseBasicParsing = $true
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        $response = Invoke-WebRequest @params
        
        $statusIcon = switch ($response.StatusCode) {
            200 { "✅" }
            201 { "✅" }
            301 { "🔄" }
            302 { "🔄" }
            403 { "🚫" }
            404 { "❌" }
            500 { "💥" }
            default { "❓" }
        }
        
        $statusColor = switch ($response.StatusCode) {
            { $_ -lt 300 } { $SuccessColor }
            { $_ -lt 400 } { $InfoColor }
            { $_ -eq 403 } { $ErrorColor }
            { $_ -lt 500 } { $WarningColor }
            default { $ErrorColor }
        }
        
        Write-ColorOutput "$statusIcon $testName - Status: $($response.StatusCode)" $statusColor
        
        if ($Detailed) {
            Write-ColorOutput "   📄 Content-Type: $($response.Headers['Content-Type'])" $InfoColor
            Write-ColorOutput "   📏 Content-Length: $($response.Headers['Content-Length'])" $InfoColor
            
            if ($response.Headers['Server']) {
                Write-ColorOutput "   🖥️ Server: $($response.Headers['Server'])" $InfoColor
            }
        }
        
        return @{
            Success = ($response.StatusCode -lt 400)
            StatusCode = $response.StatusCode
            Headers = $response.Headers
            Content = $response.Content
            IsForbidden = ($response.StatusCode -eq 403)
        }
    }
    catch {
        $errorMessage = $_.Exception.Message
        
        # Verificar se é erro 403 específico
        if ($errorMessage -match "403" -or $errorMessage -match "Forbidden") {
            Write-ColorOutput "🚫 $testName - 403 FORBIDDEN" $ErrorColor
            return @{
                Success = $false
                StatusCode = 403
                IsForbidden = $true
                Error = $errorMessage
            }
        }
        
        Write-ColorOutput "❌ $testName - Erro: $errorMessage" $ErrorColor
        
        return @{
            Success = $false
            StatusCode = 0
            IsForbidden = $false
            Error = $errorMessage
        }
    }
}

function Test-BasicAccess {
    Write-ColorOutput "🌐 Testando acesso básico..." $InfoColor
    
    $tests = @(
        @{ Url = $BaseUrl; Description = "Página Principal" },
        @{ Url = "$BaseUrl/index.php"; Description = "Index.php Direto" },
        @{ Url = "$BaseUrl/api"; Description = "Diretório API" },
        @{ Url = "$BaseUrl/api/"; Description = "Diretório API com barra" }
    )
    
    $forbiddenCount = 0
    $results = @()
    
    foreach ($test in $tests) {
        $result = Test-HttpRequest $test.Url $test.Description
        $results += $result
        
        if ($result.IsForbidden) {
            $forbiddenCount++
        }
    }
    
    Write-ColorOutput "📊 Resumo: $forbiddenCount/$($tests.Count) retornaram 403 Forbidden" $(if ($forbiddenCount -gt 0) { $ErrorColor } else { $SuccessColor })
    
    return @{
        ForbiddenCount = $forbiddenCount
        TotalTests = $tests.Count
        Results = $results
    }
}

function Test-ApiEndpoints {
    Write-ColorOutput "🔌 Testando endpoints da API..." $InfoColor
    
    $endpoints = @(
        "/api/health",
        "/api/dashboard/filters",
        "/api/dashboard/metrics",
        "/api/bpd-data",
        "/api/metrics",
        "/api/players"
    )
    
    $forbiddenCount = 0
    $results = @()
    
    foreach ($endpoint in $endpoints) {
        $url = "$BaseUrl$endpoint"
        $result = Test-HttpRequest $url "API: $endpoint"
        $results += $result
        
        if ($result.IsForbidden) {
            $forbiddenCount++
        }
    }
    
    Write-ColorOutput "📊 API Endpoints: $forbiddenCount/$($endpoints.Count) retornaram 403 Forbidden" $(if ($forbiddenCount -gt 0) { $ErrorColor } else { $SuccessColor })
    
    return @{
        ForbiddenCount = $forbiddenCount
        TotalTests = $endpoints.Count
        Results = $results
    }
}

function Test-FileAccess {
    Write-ColorOutput "📁 Testando acesso a arquivos específicos..." $InfoColor
    
    $files = @(
        @{ Path = "/.htaccess"; Description = ".htaccess" },
        @{ Path = "/.env"; Description = ".env" },
        @{ Path = "/classes/Database.php"; Description = "Database.php" },
        @{ Path = "/api/auth.php"; Description = "auth.php" }
    )
    
    $accessibleCount = 0
    $results = @()
    
    foreach ($file in $files) {
        $url = "$BaseUrl$($file.Path)"
        $result = Test-HttpRequest $url $file.Description
        $results += $result
        
        # Para arquivos sensíveis, 403 é o comportamento esperado
        if ($file.Path -match "\.(htaccess|env)$" -and $result.IsForbidden) {
            Write-ColorOutput "   ✅ Arquivo protegido corretamente" $SuccessColor
        } elseif (-not $result.IsForbidden -and $result.Success) {
            $accessibleCount++
            if ($file.Path -match "\.(htaccess|env)$") {
                Write-ColorOutput "   ⚠️ ATENÇÃO: Arquivo sensível acessível!" $WarningColor
            }
        }
    }
    
    return @{
        AccessibleCount = $accessibleCount
        TotalTests = $files.Count
        Results = $results
    }
}

function Test-ServerConfiguration {
    Write-ColorOutput "⚙️ Testando configuração do servidor..." $InfoColor
    
    # Teste de headers
    $result = Test-HttpRequest $BaseUrl "Análise de Headers"
    
    if ($result.Success -and $result.Headers) {
        $headers = $result.Headers
        
        # Verificar servidor
        if ($headers['Server']) {
            Write-ColorOutput "   🖥️ Servidor: $($headers['Server'])" $InfoColor
        }
        
        # Verificar se PHP está funcionando
        if ($headers['X-Powered-By']) {
            Write-ColorOutput "   ⚡ Powered-By: $($headers['X-Powered-By'])" $InfoColor
        }
        
        # Verificar Content-Type
        if ($headers['Content-Type']) {
            Write-ColorOutput "   📄 Content-Type: $($headers['Content-Type'])" $InfoColor
        }
        
        return $true
    } else {
        Write-ColorOutput "   ❌ Não foi possível obter informações do servidor" $ErrorColor
        return $false
    }
}

function Analyze-403-Causes {
    param(
        [int]$BasicForbidden,
        [int]$ApiForbidden,
        [array]$FileResults
    )
    
    Write-ColorOutput "" $InfoColor
    Write-ColorOutput "🔍 ANÁLISE DE POSSÍVEIS CAUSAS" $InfoColor
    Write-ColorOutput "==============================" $InfoColor
    
    $causes = @()
    
    # Análise baseada nos resultados
    if ($BasicForbidden -gt 0) {
        $causes += "❌ Problema de permissões básicas"
        Write-ColorOutput "   • Arquivos/diretórios com permissões incorretas" $ErrorColor
        Write-ColorOutput "   • Solução: Configurar permissões 644 para arquivos, 755 para diretórios" $InfoColor
    }
    
    if ($ApiForbidden -gt 0) {
        $causes += "❌ Problema no roteamento da API"
        Write-ColorOutput "   • .htaccess com configuração incorreta" $ErrorColor
        Write-ColorOutput "   • mod_rewrite não habilitado" $ErrorColor
        Write-ColorOutput "   • Solução: Verificar .htaccess e configuração do Apache" $InfoColor
    }
    
    if ($BasicForbidden -eq 0 -and $ApiForbidden -gt 0) {
        $causes += "❌ Problema específico da API"
        Write-ColorOutput "   • Roteamento não funciona" $ErrorColor
        Write-ColorOutput "   • Solução: Verificar regras de rewrite no .htaccess" $InfoColor
    }
    
    if ($causes.Count -eq 0) {
        Write-ColorOutput "✅ Nenhum erro 403 detectado!" $SuccessColor
    }
    
    return $causes
}

function Generate-Solutions {
    param([array]$Causes)
    
    if ($Causes.Count -eq 0) {
        return
    }
    
    Write-ColorOutput "" $InfoColor
    Write-ColorOutput "🛠️ SOLUÇÕES RECOMENDADAS" $InfoColor
    Write-ColorOutput "========================" $InfoColor
    
    Write-ColorOutput "1. 📁 CORRIGIR PERMISSÕES:" $WarningColor
    Write-ColorOutput "   • Diretórios: chmod 755" $InfoColor
    Write-ColorOutput "   • Arquivos PHP: chmod 644" $InfoColor
    Write-ColorOutput "   • .htaccess: chmod 644" $InfoColor
    Write-ColorOutput "   • .env: chmod 600" $InfoColor
    
    Write-ColorOutput "" $InfoColor
    Write-ColorOutput "2. 🔧 VERIFICAR .HTACCESS:" $WarningColor
    Write-ColorOutput "   • Renomear .htaccess para .htaccess.bak temporariamente" $InfoColor
    Write-ColorOutput "   • Testar se o site carrega" $InfoColor
    Write-ColorOutput "   • Se carregar, o problema está no .htaccess" $InfoColor
    
    Write-ColorOutput "" $InfoColor
    Write-ColorOutput "3. 📋 VERIFICAR ESTRUTURA:" $WarningColor
    Write-ColorOutput "   • index.php deve estar no diretório raiz (public_html)" $InfoColor
    Write-ColorOutput "   • Estrutura de diretórios deve estar correta" $InfoColor
    
    Write-ColorOutput "" $InfoColor
    Write-ColorOutput "4. 🆘 CONTATAR SUPORTE:" $WarningColor
    Write-ColorOutput "   • Informar: 'Erro 403 Forbidden em aplicação PHP'" $InfoColor
    Write-ColorOutput "   • Solicitar: 'Verificar se mod_rewrite está habilitado'" $InfoColor
    Write-ColorOutput "   • Confirmar: 'PHP 8.0+ está funcionando'" $InfoColor
}

function Create-TestFiles {
    if (-not $CreateTestFiles) {
        return
    }
    
    Write-ColorOutput "📝 Criando arquivos de teste..." $InfoColor
    
    # Arquivo de teste PHP simples
    $testPhpContent = @"
<?php
echo "<h1>Teste PHP - Funcionando!</h1>";
echo "<p>Versão PHP: " . phpversion() . "</p>";
echo "<p>Data/Hora: " . date('Y-m-d H:i:s') . "</p>";
echo "<p>Servidor: " . `$_SERVER['SERVER_SOFTWARE'] . "</p>";
?>
"@
    
    $testPhpPath = Join-Path (Get-Location) "test-php.txt"
    $testPhpContent | Out-File -FilePath $testPhpPath -Encoding UTF8
    
    # .htaccess mínimo
    $htaccessContent = @"
# .htaccess mínimo para teste
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
"@
    
    $htaccessPath = Join-Path (Get-Location) "htaccess-minimal.txt"
    $htaccessContent | Out-File -FilePath $htaccessPath -Encoding UTF8
    
    Write-ColorOutput "✅ Arquivos de teste criados:" $SuccessColor
    Write-ColorOutput "   📄 $testPhpPath" $InfoColor
    Write-ColorOutput "   📄 $htaccessPath" $InfoColor
    Write-ColorOutput "" $InfoColor
    Write-ColorOutput "💡 Instruções:" $InfoColor
    Write-ColorOutput "   1. Envie test-php.txt como test.php para o servidor" $InfoColor
    Write-ColorOutput "   2. Acesse: $BaseUrl/test.php" $InfoColor
    Write-ColorOutput "   3. Se necessário, substitua .htaccess pelo conteúdo mínimo" $InfoColor
}

# ========================================
# EXECUÇÃO PRINCIPAL
# ========================================

Write-ColorOutput "🔍 Diagnóstico de Erro 403 Forbidden" $InfoColor
Write-ColorOutput "===================================" $InfoColor

# Obter URL base
Get-BaseUrl

Write-ColorOutput "" $InfoColor
Write-ColorOutput "🎯 Testando: $BaseUrl" $InfoColor
Write-ColorOutput "" $InfoColor

# Executar testes
$basicResults = Test-BasicAccess
$apiResults = Test-ApiEndpoints
$fileResults = Test-FileAccess
$serverOk = Test-ServerConfiguration

# Análise dos resultados
$causes = Analyze-403-Causes $basicResults.ForbiddenCount $apiResults.ForbiddenCount $fileResults.Results

# Gerar soluções
Generate-Solutions $causes

# Criar arquivos de teste se solicitado
Create-TestFiles

Write-ColorOutput "" $InfoColor
Write-ColorOutput "📊 RESUMO FINAL" $InfoColor
Write-ColorOutput "==============" $InfoColor
Write-ColorOutput "🌐 Acesso Básico: $($basicResults.ForbiddenCount)/$($basicResults.TotalTests) com erro 403" $(if ($basicResults.ForbiddenCount -gt 0) { $ErrorColor } else { $SuccessColor })
Write-ColorOutput "🔌 API Endpoints: $($apiResults.ForbiddenCount)/$($apiResults.TotalTests) com erro 403" $(if ($apiResults.ForbiddenCount -gt 0) { $ErrorColor } else { $SuccessColor })
Write-ColorOutput "📁 Arquivos: $($fileResults.AccessibleCount)/$($fileResults.TotalTests) acessíveis" $InfoColor
Write-ColorOutput "⚙️ Servidor: $(if ($serverOk) { 'Respondendo' } else { 'Problema' })" $(if ($serverOk) { $SuccessColor } else { $ErrorColor })

if ($causes.Count -gt 0) {
    Write-ColorOutput "" $InfoColor
    Write-ColorOutput "⚠️ AÇÃO NECESSÁRIA: Corrija os problemas identificados acima" $WarningColor
    Write-ColorOutput "📖 Consulte o arquivo fix-permissions.md para instruções detalhadas" $InfoColor
} else {
    Write-ColorOutput "" $InfoColor
    Write-ColorOutput "🎉 Nenhum erro 403 detectado! O site parece estar funcionando." $SuccessColor
}

Write-ColorOutput "" $InfoColor
Write-ColorOutput "✅ Diagnóstico concluído!" $SuccessColor