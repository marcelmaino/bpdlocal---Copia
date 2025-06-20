# Deploy no VPS Hostinger - Guia Completo

## Vantagens do VPS Hostinger

✅ **Acesso root completo**  
✅ **Suporte total ao Docker**  
✅ **Controle total do ambiente**  
✅ **Possibilidade de usar nossa configuração Docker**  
✅ **Escalabilidade e performance**  

## Pré-requisitos

- VPS Hostinger ativo
- Acesso SSH (root ou sudo)
- Domínio configurado (opcional)
- Conhecimento básico de terminal Linux

## Passo 1: Preparação do Servidor

### 1.1 Conectar via SSH

```bash
ssh root@SEU_IP_DO_VPS
# ou
ssh usuario@SEU_IP_DO_VPS
```

### 1.2 Atualizar o Sistema

```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
```

### 1.3 Instalar Dependências Básicas

```bash
# Ubuntu/Debian
sudo apt install -y curl wget git unzip

# CentOS/RHEL
sudo yum install -y curl wget git unzip
```

## Passo 2: Instalar Docker e Docker Compose

### 2.1 Instalar Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# CentOS/RHEL
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

### 2.2 Instalar Docker Compose

```bash
# Versão mais recente
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version
```

### 2.3 Reiniciar Sessão SSH

```bash
exit
# Conectar novamente para aplicar as permissões do grupo docker
ssh root@SEU_IP_DO_VPS
```

## Passo 3: Configurar Firewall

### 3.1 UFW (Ubuntu/Debian)

```bash
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Backend
sudo ufw allow 3001/tcp  # Frontend (temporário)
sudo ufw --force enable
sudo ufw status
```

### 3.2 Firewalld (CentOS/RHEL)

```bash
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

## Passo 4: Preparar o Código

### 4.1 Clonar o Repositório

```bash
# Opção 1: Via Git (se o repo estiver no GitHub/GitLab)
git clone https://github.com/SEU_USUARIO/bpdlocal.git
cd bpdlocal

# Opção 2: Upload via SCP/SFTP
# No seu computador local:
# scp -r c:\projetos\bpdlocal root@SEU_IP:/root/
```

### 4.2 Configurar Variáveis de Ambiente

```bash
cp .env.example .env
nano .env
```

**Configuração do .env para produção:**

```env
# Backend Configuration
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_NAME=bpd_dashboard
DB_USER=bpd_user
DB_PASSWORD=SUA_SENHA_SEGURA_AQUI

# Security
JWT_SECRET=SUA_CHAVE_JWT_MUITO_SEGURA_AQUI
CORS_ORIGIN=http://SEU_DOMINIO.com,https://SEU_DOMINIO.com

# Frontend Configuration
VITE_API_URL=http://SEU_IP_OU_DOMINIO:5000

# MySQL Root (for initialization)
MYSQL_ROOT_PASSWORD=SUA_SENHA_ROOT_MYSQL
```

## Passo 5: Deploy com Docker

### 5.1 Build e Deploy

```bash
# Dar permissão ao script
chmod +x deploy.sh

# Executar deploy de produção
./deploy.sh prod

# OU executar manualmente:
docker-compose -f docker-compose.prod.yml up -d --build
```

### 5.2 Verificar Status

```bash
# Verificar containers
docker ps

# Verificar logs
docker-compose -f docker-compose.prod.yml logs -f

# Verificar logs específicos
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs mysql
```

## Passo 6: Configurar Nginx (Opcional)

### 6.1 Instalar Nginx

```bash
sudo apt install nginx -y
# ou
sudo yum install nginx -y

sudo systemctl start nginx
sudo systemctl enable nginx
```

### 6.2 Configurar Proxy Reverso

```bash
sudo nano /etc/nginx/sites-available/bpd-dashboard
```

**Configuração do Nginx:**

```nginx
server {
    listen 80;
    server_name SEU_DOMINIO.com www.SEU_DOMINIO.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6.3 Ativar Configuração

```bash
sudo ln -s /etc/nginx/sites-available/bpd-dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Passo 7: Configurar SSL com Let's Encrypt

### 7.1 Instalar Certbot

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx -y
```

### 7.2 Obter Certificado SSL

```bash
sudo certbot --nginx -d SEU_DOMINIO.com -d www.SEU_DOMINIO.com
```

### 7.3 Configurar Renovação Automática

```bash
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Passo 8: Monitoramento e Manutenção

### 8.1 Scripts Úteis

**Verificar status:**
```bash
#!/bin/bash
echo "=== Status dos Containers ==="
docker ps
echo "\n=== Uso de Recursos ==="
docker stats --no-stream
echo "\n=== Espaço em Disco ==="
df -h
```

**Backup do banco:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec bpdlocal_mysql_1 mysqldump -u root -p$MYSQL_ROOT_PASSWORD bpd_dashboard > backup_$DATE.sql
echo "Backup criado: backup_$DATE.sql"
```

### 8.2 Logs e Monitoramento

```bash
# Monitorar logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f

# Verificar uso de recursos
docker stats

# Verificar espaço em disco
df -h
du -sh /var/lib/docker/
```

## URLs de Acesso

- **Frontend**: `http://SEU_IP:3001` ou `https://SEU_DOMINIO.com`
- **Backend API**: `http://SEU_IP:5000` ou `https://SEU_DOMINIO.com/api`
- **phpMyAdmin**: `http://SEU_IP:8080` (se habilitado)

## Comandos de Manutenção

```bash
# Parar aplicação
docker-compose -f docker-compose.prod.yml down

# Atualizar aplicação
git pull
docker-compose -f docker-compose.prod.yml up -d --build

# Limpar recursos não utilizados
docker system prune -a

# Backup completo
tar -czf backup_$(date +%Y%m%d).tar.gz /root/bpdlocal
```

## Troubleshooting

### Problemas Comuns:

1. **Container não inicia**: Verificar logs com `docker logs CONTAINER_NAME`
2. **Erro de conexão com banco**: Verificar variáveis de ambiente
3. **Erro 502 no Nginx**: Verificar se containers estão rodando
4. **Falta de espaço**: Limpar imagens antigas com `docker system prune`

### Comandos de Diagnóstico:

```bash
# Verificar portas em uso
sudo netstat -tlnp

# Verificar logs do sistema
sudo journalctl -u docker

# Verificar recursos do sistema
top
free -h
```

---

## Próximos Passos

1. **Execute os comandos de preparação do servidor**
2. **Instale Docker e Docker Compose**
3. **Configure o firewall**
4. **Faça upload do código**
5. **Configure as variáveis de ambiente**
6. **Execute o deploy**
7. **Configure domínio e SSL (opcional)**

**Vamos começar? Me informe quando estiver conectado no VPS e eu te guio passo a passo!**