# 🚀 Guia de Deploy - BPD Dashboard

Este guia contém instruções detalhadas para realizar o deploy da aplicação BPD Dashboard em produção.

## 📋 Pré-requisitos

### Obrigatórios
- [Docker](https://www.docker.com/get-started) (versão 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (versão 2.0+)
- Git (para versionamento)
- Pelo menos 4GB de RAM disponível
- Pelo menos 10GB de espaço em disco

### Opcionais
- Domínio próprio (para produção)
- Certificado SSL (para HTTPS)
- Servidor VPS/Cloud (AWS, DigitalOcean, etc.)

## 🏗️ Arquivos de Configuração

### Desenvolvimento
- `docker-compose.yml` - Configuração para desenvolvimento
- Frontend roda em modo dev (Vite)
- Hot reload habilitado

### Produção
- `docker-compose.prod.yml` - Configuração otimizada para produção
- Frontend buildado e servido via Nginx
- Containers otimizados para performance
- Health checks configurados

## 🔧 Configuração Inicial

### 1. Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

**⚠️ IMPORTANTE**: Altere as seguintes variáveis para produção:

```env
# Segurança - ALTERE OBRIGATORIAMENTE
JWT_SECRET=seu_jwt_secret_super_seguro_min_32_caracteres
MYSQL_ROOT_PASSWORD=sua_senha_root_super_segura
DB_PASSWORD=sua_senha_db_super_segura

# Domínio (se aplicável)
CORS_ORIGIN=https://seudominio.com
VITE_API_URL=https://api.seudominio.com
```

### 2. Configuração de SSL (Opcional)

Para HTTPS em produção, crie o diretório `ssl` e adicione seus certificados:

```bash
mkdir ssl
# Copie seus arquivos .crt e .key para o diretório ssl/
```

## 🚀 Deploy

### Opção 1: Script Automatizado (Recomendado)

#### Windows (PowerShell)
```powershell
# Deploy de produção
.\deploy.ps1 prod

# Deploy de desenvolvimento
.\deploy.ps1 dev
```

#### Linux/Mac (Bash)
```bash
# Dar permissão de execução
chmod +x deploy.sh

# Deploy de produção
./deploy.sh prod

# Deploy de desenvolvimento
./deploy.sh dev
```

### Opção 2: Manual

#### Produção
```bash
# Parar containers existentes
docker-compose -f docker-compose.prod.yml down

# Build das imagens
docker-compose -f docker-compose.prod.yml build --no-cache

# Iniciar containers
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.prod.yml ps
```

#### Desenvolvimento
```bash
# Parar containers existentes
docker-compose down

# Iniciar containers
docker-compose up -d

# Verificar status
docker-compose ps
```

## 🌐 URLs de Acesso

### Produção
- **Frontend**: http://localhost (porta 80)
- **Backend API**: http://localhost:5000
- **phpMyAdmin**: http://localhost:8080
- **MySQL**: localhost:3306

### Desenvolvimento
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:5000
- **phpMyAdmin**: http://localhost:8080
- **MySQL**: localhost:3306

## 🔍 Monitoramento e Logs

### Ver logs em tempo real
```bash
# Todos os serviços
docker-compose -f docker-compose.prod.yml logs -f

# Serviço específico
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f mysql
```

### Verificar status dos containers
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Health checks
```bash
# Backend
curl http://localhost:5000/api/health

# Frontend (via nginx)
curl http://localhost/
```

## 🛠️ Comandos Úteis

### Gerenciamento de Containers
```bash
# Parar todos os containers
docker-compose -f docker-compose.prod.yml down

# Reiniciar um serviço específico
docker-compose -f docker-compose.prod.yml restart backend

# Rebuild de um serviço específico
docker-compose -f docker-compose.prod.yml build --no-cache frontend
docker-compose -f docker-compose.prod.yml up -d frontend
```

### Backup do Banco de Dados
```bash
# Criar backup
docker exec bpdlocal_mysql_1 mysqldump -u root -p bpd_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker exec -i bpdlocal_mysql_1 mysql -u root -p bpd_database < backup_file.sql
```

### Limpeza do Sistema
```bash
# Remover containers parados
docker container prune -f

# Remover imagens não utilizadas
docker image prune -f

# Limpeza completa (cuidado!)
docker system prune -a -f
```

## 🔒 Segurança em Produção

### Checklist de Segurança
- [ ] Alterar todas as senhas padrão
- [ ] Configurar JWT_SECRET forte
- [ ] Configurar CORS adequadamente
- [ ] Usar HTTPS (SSL/TLS)
- [ ] Configurar firewall
- [ ] Atualizar regularmente as imagens Docker
- [ ] Monitorar logs de segurança
- [ ] Fazer backups regulares

### Configurações Recomendadas
```env
# Use senhas fortes (mínimo 16 caracteres)
JWT_SECRET=sua_chave_jwt_super_segura_com_pelo_menos_32_caracteres
MYSQL_ROOT_PASSWORD=SuaSenhaRootSuperSegura123!
DB_PASSWORD=SuaSenhaDBSuperSegura123!

# Configure CORS para seu domínio
CORS_ORIGIN=https://seudominio.com
```

## 🚨 Troubleshooting

### Problemas Comuns

#### Container não inicia
```bash
# Verificar logs
docker-compose -f docker-compose.prod.yml logs [service_name]

# Verificar recursos do sistema
docker system df
free -h  # Linux
```

#### Erro de conexão com banco
```bash
# Verificar se o MySQL está rodando
docker-compose -f docker-compose.prod.yml ps mysql

# Testar conexão
docker exec -it bpdlocal_mysql_1 mysql -u root -p
```

#### Frontend não carrega
```bash
# Verificar se o build foi bem-sucedido
docker-compose -f docker-compose.prod.yml logs frontend

# Verificar se o nginx está servindo os arquivos
docker exec -it bpdlocal_frontend_1 ls -la /usr/share/nginx/html
```

### Logs de Debug
```bash
# Habilitar logs detalhados
export COMPOSE_LOG_LEVEL=DEBUG
docker-compose -f docker-compose.prod.yml up
```

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs dos containers
2. Consulte a seção de troubleshooting
3. Verifique se todas as variáveis de ambiente estão configuradas
4. Certifique-se de que o Docker tem recursos suficientes

---

**✅ Pronto!** Sua aplicação BPD Dashboard está configurada para deploy em produção.