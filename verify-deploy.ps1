# ========================================
# Script de Verificação Pós-Deploy
# ========================================

param(
    [string]$BaseUrl = "",
    [string]$Username = "",
    [string]$Password = "",
    [switch]$Detailed = $false,
    [switch]$SkipAuth = $false
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

function Get-ApiCredentials {
    if ([string]::IsNullOrEmpty($BaseUrl)) {
        $script:BaseUrl = Read-Host "Digite a URL base da API (ex: https://seudominio.com/api)"
    }
    
    if (-not $SkipAuth) {
        if ([string]::IsNullOrEmpty($Username)) {
            $script:Username = Read-Host "Digite o usuário para teste de autenticação"
        }
        
        if ([string]::IsNullOrEmpty($Password)) {
            $script:Password = Read-Host "Digite a senha" -AsSecureString
            $script:Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($script:Password))
        }
    }
}

function Test-Endpoint {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [string]$Description = ""
    )
    
    $url = "$BaseUrl$Endpoint"
    $testName = if ($Description) { $Description } else { $Endpoint }
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            TimeoutSec = 30
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        $statusIcon = switch ($response.StatusCode) {
            200 { "✅" }
            201 { "✅" }
            400 { "⚠️" }
            401 { "🔒" }
            404 { "❌" }
            500 { "💥" }
            default { "❓" }
        }
        
        Write-ColorOutput "$statusIcon $testName - Status: $($response.StatusCode)" $(if ($response.StatusCode -lt 400) { $SuccessColor } else { $WarningColor })
        
        if ($Detailed -and $response.Content) {
            try {
                $jsonContent = $response.Content | ConvertFrom-Json
                Write-ColorOutput "   📄 Resposta: $($jsonContent | ConvertTo-Json -Compress)" $InfoColor
            }
            catch {
                Write-ColorOutput "   📄 Resposta (texto): $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." $InfoColor
            }
        }
        
        return @{
            Success = ($response.StatusCode -lt 400)
            StatusCode = $response.StatusCode
            Content = $response.Content
            Response = $response
        }
    }
    catch {
        Write-ColorOutput "❌ $testName - Erro: $($_.Exception.Message)" $ErrorColor
        
        if ($Detailed) {
            Write-ColorOutput "   🔍 Detalhes: $($_.Exception.ToString())" $ErrorColor
        }
        
        return @{
            Success = $false
            StatusCode = 0
            Content = $null
            Error = $_.Exception.Message
        }
    }
}

function Test-Authentication {
    Write-ColorOutput "🔐 Testando autenticação..." $InfoColor
    
    if ($SkipAuth) {
        Write-ColorOutput "⏭️ Testes de autenticação ignorados" $WarningColor
        return $null
    }
    
    # Teste de login
    $loginBody = @{
        username = $Username
        password = $Password
    } | ConvertTo-Json
    
    $loginResult = Test-Endpoint "/auth/login" "POST" @{} $loginBody "Login"
    
    if ($loginResult.Success) {
        try {
            $loginResponse = $loginResult.Content | ConvertFrom-Json
            if ($loginResponse.token) {
                Write-ColorOutput "✅ Token de autenticação obtido" $SuccessColor
                return $loginResponse.token
            }
        }
        catch {
            Write-ColorOutput "⚠️ Resposta de login inválida" $WarningColor
        }
    }
    
    return $null
}

function Test-BasicEndpoints {
    Write-ColorOutput "🌐 Testando endpoints básicos..." $InfoColor
    
    $basicTests = @(
        @{ Endpoint = "/health"; Description = "Health Check" },
        @{ Endpoint = "/api/health"; Description = "API Health Check" },
        @{ Endpoint = "/"; Description = "Root Endpoint" }
    )
    
    $successCount = 0
    
    foreach ($test in $basicTests) {
        $result = Test-Endpoint $test.Endpoint "GET" @{} $null $test.Description
        if ($result.Success) {
            $successCount++
        }
    }
    
    Write-ColorOutput "📊 Endpoints básicos: $successCount/$($basicTests.Count) funcionando" $InfoColor
    return $successCount
}

function Test-ApiEndpoints {
    param([string]$AuthToken = $null)
    
    Write-ColorOutput "🔌 Testando endpoints da API..." $InfoColor
    
    $headers = @{}
    if ($AuthToken) {
        $headers["Authorization"] = "Bearer $AuthToken"
    }
    
    $apiTests = @(
        @{ Endpoint = "/dashboard/filters"; Description = "Dashboard Filters" },
        @{ Endpoint = "/dashboard/metrics"; Description = "Dashboard Metrics" },
        @{ Endpoint = "/bpd-data"; Description = "BPD Data" },
        @{ Endpoint = "/metrics"; Description = "Metrics" },
        @{ Endpoint = "/players"; Description = "Players" }
    )
    
    $successCount = 0
    
    foreach ($test in $apiTests) {
        $result = Test-Endpoint $test.Endpoint "GET" $headers $null $test.Description
        if ($result.Success) {
            $successCount++
        }
    }
    
    Write-ColorOutput "📊 Endpoints da API: $successCount/$($apiTests.Count) funcionando" $InfoColor
    return $successCount
}

function Test-DatabaseConnection {
    Write-ColorOutput "🗄️ Testando conexão com banco de dados..." $InfoColor
    
    # Tentar endpoint que requer banco
    $result = Test-Endpoint "/dashboard/filters" "GET" @{} $null "Database Connection Test"
    
    if ($result.Success) {
        Write-ColorOutput "✅ Conexão com banco de dados funcionando" $SuccessColor
        return $true
    } else {
        Write-ColorOutput "❌ Possível problema na conexão com banco de dados" $ErrorColor
        return $false
    }
}

function Test-CorsConfiguration {
    Write-ColorOutput "🌍 Testando configuração CORS..." $InfoColor
    
    try {
        # Simular preflight request
        $headers = @{
            "Origin" = "https://example.com"
            "Access-Control-Request-Method" = "GET"
            "Access-Control-Request-Headers" = "Content-Type"
        }
        
        $result = Test-Endpoint "/health" "OPTIONS" $headers $null "CORS Preflight"
        
        if ($result.Success) {
            Write-ColorOutput "✅ CORS configurado corretamente" $SuccessColor
            return $true
        } else {
            Write-ColorOutput "⚠️ CORS pode não estar configurado" $WarningColor
            return $false
        }
    }
    catch {
        Write-ColorOutput "⚠️ Não foi possível testar CORS" $WarningColor
        return $false
    }
}

function Test-SecurityHeaders {
    Write-ColorOutput "🛡️ Testando headers de segurança..." $InfoColor
    
    $result = Test-Endpoint "/health" "GET"
    
    if ($result.Success -and $result.Response) {
        $securityHeaders = @(
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection"
        )
        
        $foundHeaders = 0
        
        foreach ($header in $securityHeaders) {
            if ($result.Response.Headers[$header]) {
                Write-ColorOutput "✅ $header presente" $SuccessColor
                $foundHeaders++
            } else {
                Write-ColorOutput "⚠️ $header ausente" $WarningColor
            }
        }
        
        Write-ColorOutput "📊 Headers de segurança: $foundHeaders/$($securityHeaders.Count) configurados" $InfoColor
        return $foundHeaders
    }
    
    return 0
}

function Test-Performance {
    Write-ColorOutput "⚡ Testando performance..." $InfoColor
    
    $performanceTests = @(
        "/health",
        "/dashboard/filters",
        "/dashboard/metrics"
    )
    
    foreach ($endpoint in $performanceTests) {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $result = Test-Endpoint $endpoint "GET"
        $stopwatch.Stop()
        
        $responseTime = $stopwatch.ElapsedMilliseconds
        $performanceIcon = if ($responseTime -lt 1000) { "🚀" } elseif ($responseTime -lt 3000) { "⚡" } else { "🐌" }
        
        Write-ColorOutput "$performanceIcon $endpoint - Tempo: ${responseTime}ms" $InfoColor
    }
}

function Generate-Report {
    param(
        [int]$BasicEndpoints,
        [int]$ApiEndpoints,
        [bool]$DatabaseOk,
        [bool]$CorsOk,
        [int]$SecurityHeaders,
        [string]$AuthToken
    )
    
    Write-ColorOutput "" $InfoColor
    Write-ColorOutput "📋 RELATÓRIO FINAL DE VERIFICAÇÃO" $InfoColor
    Write-ColorOutput "================================" $InfoColor
    
    # Status geral
    $overallScore = 0
    $maxScore = 0
    
    # Endpoints básicos (peso 2)
    $basicScore = ($BasicEndpoints / 3.0) * 2
    $overallScore += $basicScore
    $maxScore += 2
    
    # Endpoints da API (peso 3)
    $apiScore = ($ApiEndpoints / 5.0) * 3
    $overallScore += $apiScore
    $maxScore += 3
    
    # Banco de dados (peso 2)
    $dbScore = if ($DatabaseOk) { 2 } else { 0 }
    $overallScore += $dbScore
    $maxScore += 2
    
    # CORS (peso 1)
    $corsScore = if ($CorsOk) { 1 } else { 0 }
    $overallScore += $corsScore
    $maxScore += 1
    
    # Segurança (peso 1)
    $secScore = ($SecurityHeaders / 3.0) * 1
    $overallScore += $secScore
    $maxScore += 1
    
    # Autenticação (peso 1)
    $authScore = if ($AuthToken) { 1 } else { 0 }
    $overallScore += $authScore
    $maxScore += 1
    
    $percentage = [Math]::Round(($overallScore / $maxScore) * 100, 1)
    
    Write-ColorOutput "🎯 Pontuação Geral: $percentage% ($overallScore/$maxScore pontos)" $InfoColor
    Write-ColorOutput "" $InfoColor
    
    # Detalhamento
    Write-ColorOutput "📊 Detalhamento:" $InfoColor
    Write-ColorOutput "   🌐 Endpoints Básicos: $BasicEndpoints/3" $(if ($BasicEndpoints -eq 3) { $SuccessColor } else { $WarningColor })
    Write-ColorOutput "   🔌 Endpoints da API: $ApiEndpoints/5" $(if ($ApiEndpoints -eq 5) { $SuccessColor } else { $WarningColor })
    Write-ColorOutput "   🗄️ Banco de Dados: $(if ($DatabaseOk) { 'OK' } else { 'ERRO' })" $(if ($DatabaseOk) { $SuccessColor } else { $ErrorColor })
    Write-ColorOutput "   🌍 CORS: $(if ($CorsOk) { 'OK' } else { 'AVISO' })" $(if ($CorsOk) { $SuccessColor } else { $WarningColor })
    Write-ColorOutput "   🛡️ Segurança: $SecurityHeaders/3 headers" $(if ($SecurityHeaders -eq 3) { $SuccessColor } else { $WarningColor })
    Write-ColorOutput "   🔐 Autenticação: $(if ($AuthToken) { 'OK' } else { 'NÃO TESTADA' })" $(if ($AuthToken) { $SuccessColor } else { $WarningColor })
    
    Write-ColorOutput "" $InfoColor
    
    # Recomendações
    if ($percentage -lt 70) {
        Write-ColorOutput "⚠️ ATENÇÃO: Deploy precisa de correções!" $ErrorColor
    } elseif ($percentage -lt 90) {
        Write-ColorOutput "⚠️ Deploy funcional, mas pode ser melhorado" $WarningColor
    } else {
        Write-ColorOutput "🎉 Deploy em excelente estado!" $SuccessColor
    }
    
    # Recomendações específicas
    Write-ColorOutput "" $InfoColor
    Write-ColorOutput "💡 Recomendações:" $InfoColor
    
    if ($BasicEndpoints -lt 3) {
        Write-ColorOutput "   - Verificar configuração básica do servidor" $WarningColor
    }
    
    if ($ApiEndpoints -lt 5) {
        Write-ColorOutput "   - Verificar rotas da API e configuração do .htaccess" $WarningColor
    }
    
    if (-not $DatabaseOk) {
        Write-ColorOutput "   - Verificar conexão e configuração do banco de dados" $ErrorColor
    }
    
    if (-not $CorsOk) {
        Write-ColorOutput "   - Configurar headers CORS no .htaccess" $WarningColor
    }
    
    if ($SecurityHeaders -lt 3) {
        Write-ColorOutput "   - Adicionar headers de segurança no .htaccess" $WarningColor
    }
    
    if (-not $AuthToken) {
        Write-ColorOutput "   - Testar sistema de autenticação" $InfoColor
    }
}

# ========================================
# EXECUÇÃO PRINCIPAL
# ========================================

Write-ColorOutput "🔍 BPD Dashboard - Verificação de Deploy" $InfoColor
Write-ColorOutput "========================================" $InfoColor

# Obter credenciais
Get-ApiCredentials

Write-ColorOutput "" $InfoColor
Write-ColorOutput "🚀 Iniciando verificação completa..." $InfoColor
Write-ColorOutput "" $InfoColor

# Executar testes
$basicEndpoints = Test-BasicEndpoints
$authToken = Test-Authentication
$apiEndpoints = Test-ApiEndpoints $authToken
$databaseOk = Test-DatabaseConnection
$corsOk = Test-CorsConfiguration
$securityHeaders = Test-SecurityHeaders

if ($Detailed) {
    Test-Performance
}

# Gerar relatório final
Generate-Report $basicEndpoints $apiEndpoints $databaseOk $corsOk $securityHeaders $authToken

Write-ColorOutput "" $InfoColor
Write-ColorOutput "✅ Verificação concluída!" $SuccessColor