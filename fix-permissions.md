# 🔧 Correção de Erro 403 Forbidden - Guia Completo

## 🚨 Problema Identificado
Após o upload via FTP, o site retorna **403 Forbidden** (Permissão Negada).

## 🔍 Principais Causas

### 1. **Permissões de Arquivos Incorretas**
- Arquivos PHP precisam ter permissão **644**
- Diretórios precisam ter permissão **755**
- Arquivo .htaccess precisa ter permissão **644**

### 2. **Arquivo index.php Ausente ou Inacessível**
- O servidor não encontra o arquivo principal
- Permissões impedem a leitura do index.php

### 3. **Configuração .htaccess Problemática**
- Sintaxe incorreta no .htaccess
- Módulos Apache não habilitados
- Regras de rewrite conflitantes

### 4. **Estrutura de Diretórios Incorreta**
- Arquivos no diretório errado
- Falta do diretório public_html ou www

## 🛠️ Soluções Passo a Passo

### **Solução 1: Corrigir Permissões via FTP**

#### Usando FileZilla ou Cliente FTP:
1. **Conecte ao FTP**
2. **Navegue até o diretório raiz** (public_html, www, ou htdocs)
3. **Selecione todos os arquivos PHP**
4. **Clique com botão direito → Permissões de Arquivo**
5. **Configure:**
   - **Arquivos PHP**: `644` (rw-r--r--)
   - **Diretórios**: `755` (rwxr-xr-x)
   - **Arquivo .htaccess**: `644` (rw-r--r--)

#### Permissões Específicas:
```
index.php          → 644
api/               → 755
api/*.php          → 644
classes/           → 755
classes/*.php      → 644
config/            → 755
config/*.php       → 644
.htaccess          → 644
.env               → 600 (mais restritivo)
```

### **Solução 2: Verificar Estrutura de Arquivos**

#### Estrutura Correta no Servidor:
```
/public_html/ (ou /www/ ou /htdocs/)
├── index.php          ← ARQUIVO PRINCIPAL
├── .htaccess          ← CONFIGURAÇÃO APACHE
├── .env               ← CONFIGURAÇÕES
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

### **Solução 3: Verificar .htaccess**

#### Teste com .htaccess Mínimo:
Crie um arquivo `.htaccess` simples primeiro:

```apache
# .htaccess mínimo para teste
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

#### Se o erro persistir, remova temporariamente o .htaccess:
1. **Renomeie** `.htaccess` para `.htaccess.bak`
2. **Teste** se o site carrega
3. **Se carregar**, o problema está no .htaccess

### **Solução 4: Verificar index.php**

#### Teste Simples:
Crie um arquivo `test.php` no diretório raiz:

```php
<?php
echo "Servidor PHP funcionando!";
echo "<br>Versão PHP: " . phpversion();
echo "<br>Data/Hora: " . date('Y-m-d H:i:s');
?>
```

Acesse: `https://seudominio.com/test.php`

- **Se carregar**: PHP está funcionando, problema no index.php
- **Se não carregar**: Problema de permissões ou configuração

## 🔧 Comandos via SSH (se disponível)

### **Corrigir Permissões via SSH:**
```bash
# Navegar para o diretório
cd /public_html/

# Corrigir permissões de diretórios
find . -type d -exec chmod 755 {} \;

# Corrigir permissões de arquivos
find . -type f -exec chmod 644 {} \;

# Permissão especial para .env
chmod 600 .env

# Verificar permissões
ls -la
```

### **Verificar Logs de Erro:**
```bash
# Ver últimos erros do Apache
tail -f /var/log/apache2/error.log

# Ou logs do cPanel
tail -f ~/logs/error_log
```

## 🎯 Diagnóstico Rápido

### **Teste 1: Arquivo Simples**
Crie `info.php`:
```php
<?php phpinfo(); ?>
```

### **Teste 2: Verificar Diretório**
Acesse apenas: `https://seudominio.com/`
- **403**: Problema de permissões ou index ausente
- **500**: Problema no .htaccess ou PHP
- **404**: Arquivo não encontrado

### **Teste 3: Verificar API**
Acesse: `https://seudominio.com/api/health`
- **403**: Permissões ou .htaccess
- **404**: Roteamento não funciona
- **500**: Erro no código PHP

## 📋 Checklist de Verificação

### ✅ **Permissões**
- [ ] Diretórios: 755
- [ ] Arquivos PHP: 644
- [ ] .htaccess: 644
- [ ] .env: 600

### ✅ **Arquivos**
- [ ] index.php existe no diretório raiz
- [ ] .htaccess configurado corretamente
- [ ] Estrutura de diretórios correta
- [ ] Todos os arquivos foram enviados

### ✅ **Configuração**
- [ ] .env com configurações corretas
- [ ] Banco de dados configurado
- [ ] Domínio apontando para diretório correto

## 🚨 Soluções por Tipo de Hosting

### **Shared Hosting (cPanel)**
1. **Acesse o File Manager**
2. **Navegue até public_html**
3. **Selecione todos os arquivos**
4. **Permissions → Change Permissions**
5. **Configure conforme tabela acima**

### **VPS/Dedicado**
1. **Acesse via SSH**
2. **Execute comandos de permissão**
3. **Verifique configuração do Apache**
4. **Reinicie o Apache se necessário**

### **Hostinger/Umbler**
1. **Use o File Manager do painel**
2. **Configure permissões via interface**
3. **Verifique logs de erro no painel**

## 🔍 Comandos de Diagnóstico

### **Via Browser:**
```
# Teste básico
https://seudominio.com/

# Teste PHP
https://seudominio.com/test.php

# Teste API
https://seudominio.com/api/health

# Teste específico
https://seudominio.com/index.php
```

### **Via cURL (se disponível):**
```bash
# Teste com headers
curl -I https://seudominio.com/

# Teste detalhado
curl -v https://seudominio.com/api/health
```

## 📞 Próximos Passos

### **Se o problema persistir:**
1. **Contate o suporte do hosting**
2. **Verifique se PHP está habilitado**
3. **Confirme se mod_rewrite está ativo**
4. **Verifique se o domínio aponta para o diretório correto**

### **Informações para o suporte:**
- Erro exato: "403 Forbidden"
- Localização dos arquivos: `/public_html/`
- Tipo de aplicação: "API PHP com .htaccess"
- Módulos necessários: "mod_rewrite, PHP 8.0+"

## ✅ Verificação Final

Após corrigir as permissões, teste:

1. **Página inicial**: `https://seudominio.com/`
2. **API Health**: `https://seudominio.com/api/health`
3. **Endpoint específico**: `https://seudominio.com/api/dashboard/filters`

Se todos carregarem sem erro 403, o problema foi resolvido! 🎉

---

**💡 Dica**: Sempre mantenha um backup das configurações funcionais e documente as permissões que funcionaram para seu hosting específico.