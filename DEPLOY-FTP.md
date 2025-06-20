# 📦 Plano de Deploy via FTP - Backend PHP

## 🎯 Objetivo
Fazer deploy do backend PHP para servidor de produção via FTP, mantendo a estrutura e configurações necessárias.

## 📋 Pré-requisitos

### 🖥️ Servidor de Destino
- **PHP**: Versão 8.0 ou superior
- **MySQL**: Versão 8.0 ou superior
- **Apache/Nginx**: Com mod_rewrite habilitado
- **Extensões PHP necessárias**:
  - `pdo`
  - `pdo_mysql`
  - `mysqli`
  - `json`
  - `curl`

### 🔑 Credenciais Necessárias
- **FTP**: Host, usuário, senha, porta
- **Banco de dados**: Host, usuário, senha, nome do banco
- **Domínio**: URL final da aplicação

## 📁 Estrutura de Deploy

```
/public_html/ (ou diretório raiz do servidor)
├── .htaccess
├── index.php
├── .env
├── api/
│   ├── auth.php
│   ├── bpd-data.php
│   ├── filters.php
│   ├── metrics.php
│   ├── players.php
│   └── validate.php
├── classes/
│   ├── Auth.php
│   └── Database.php
└── config/
    └── database.php
```

## 🚀 Processo de Deploy

### Etapa 1: Preparação dos Arquivos

1. **Criar arquivo .env de produção**
2. **Verificar configurações de segurança**
3. **Testar conexão com banco local**
4. **Preparar estrutura de upload**

### Etapa 2: Upload via FTP

1. **Conectar ao servidor FTP**
2. **Fazer backup dos arquivos existentes**
3. **Upload dos arquivos PHP**
4. **Configurar permissões**

### Etapa 3: Configuração do Banco

1. **Criar banco de dados no servidor**
2. **Importar estrutura e dados**
3. **Configurar usuário e permissões**
4. **Testar conexão**

### Etapa 4: Configuração do Servidor

1. **Verificar .htaccess**
2. **Configurar CORS**
3. **Testar rotas da API**
4. **Verificar logs de erro**

### Etapa 5: Testes de Produção

1. **Testar endpoints da API**
2. **Verificar autenticação**
3. **Testar filtros e métricas**
4. **Validar performance**

## 🛠️ Scripts de Automação

### Script PowerShell para Deploy
```powershell
# deploy-ftp.ps1
# Configurações (editar antes de usar)
$ftpHost = "alderaan08.umbler.host"
$ftpUser = "bpd-marcelmaino-com-br"
$ftpPass = "oB0g:^WNq#_!t%1"
$ftpPath = "/public/"
$localPath = "./backend-php/"

# Função para upload via FTP
function Upload-FTP {
    param($LocalFile, $RemoteFile)
    # Implementação do upload
}

# Upload dos arquivos
Write-Host "Iniciando deploy..."
Upload-FTP "$localPath*" "$ftpPath"
Write-Host "Deploy concluído!"
```

### Script de Verificação
```powershell
# verify-deploy.ps1
$apiUrl = "https://bpd.marcelmaino.com.br/api"

# Testar endpoints
$endpoints = @(
    "/health",
    "/dashboard/filters",
    "/dashboard/metrics"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest "$apiUrl$endpoint"
        Write-Host "✅ $endpoint - Status: $($response.StatusCode)"
    } catch {
        Write-Host "❌ $endpoint - Erro: $($_.Exception.Message)"
    }
}
```

## 📝 Checklist de Deploy

### ✅ Antes do Deploy
- [ ] Backup do servidor atual
- [ ] Arquivo .env configurado
- [ ] Banco de dados preparado
- [ ] Credenciais FTP testadas
- [ ] Estrutura local validada

### ✅ Durante o Deploy
- [ ] Upload de arquivos PHP
- [ ] Configuração de permissões
- [ ] Import do banco de dados
- [ ] Configuração do .htaccess
- [ ] Teste de conectividade

### ✅ Após o Deploy
- [ ] Teste de todos os endpoints
- [ ] Verificação de logs
- [ ] Teste de autenticação
- [ ] Validação de CORS
- [ ] Teste de performance

## 🔧 Configurações Específicas

### Arquivo .env de Produção
```env
# Database
DB_HOST=mysql465.umbler.com
DB_USER=bpd
DB_PASSWORD=WC.3cK7|tk)Ri
DB_NAME=bpd_database
DB_PORT=3306

# Application
APP_ENV=production
APP_DEBUG=false
APP_URL=https://bpd.marcelmaino.com.br

# Security
JWT_SECRET=WC.3cK7|tk)Ri
CORS_ORIGIN=https://bpd.marcelmaino.com.br
```

### .htaccess Otimizado
```apache
# Configurações de produção
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"

# CORS para produção
Header always set Access-Control-Allow-Origin "https://bpd.marcelmaino.com.br"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type, Authorization"

# Cache control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType application/json "access plus 1 hour"
</IfModule>

# Proteger arquivos sensíveis
<Files ".env">
    Order allow,deny
    Deny from all
</Files>

<Files "*.log">
    Order allow,deny
    Deny from all
</Files>
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro 500 - Internal Server Error**
   - Verificar logs do Apache/PHP
   - Validar sintaxe do .htaccess
   - Conferir permissões de arquivos

2. **Erro de Conexão com Banco**
   - Verificar credenciais no .env
   - Testar conexão manual
   - Verificar firewall/IP whitelist

3. **CORS Errors**
   - Configurar headers no .htaccess
   - Verificar domínio de origem
   - Testar preflight requests

4. **Rotas não funcionam**
   - Verificar mod_rewrite
   - Validar .htaccess
   - Conferir estrutura de diretórios

### Logs Importantes
```bash
# Logs do Apache
tail -f /var/log/apache2/error.log

# Logs do PHP
tail -f /var/log/php/error.log

# Logs personalizados (se configurados)
tail -f /path/to/app/logs/app.log
```

## 📞 Suporte

### Comandos Úteis
```bash
# Verificar versão do PHP
php -v

# Verificar extensões instaladas
php -m

# Testar sintaxe de arquivo PHP
php -l arquivo.php

# Verificar configuração do Apache
apache2ctl configtest
```

### Contatos de Emergência
- **Suporte do Hosting**: [inserir contato]
- **Administrador do Sistema**: [inserir contato]
- **Desenvolvedor**: [inserir contato]

---

**📅 Data de Criação**: $(Get-Date -Format "dd/MM/yyyy HH:mm")
**👤 Responsável**: [Nome do responsável]
**🔄 Última Atualização**: [Data da última modificação]