# Deploy na Umbler - Guia Tradicional (sem Docker)

## Situação Identificada

O servidor da Umbler está rodando dentro de um **container Docker** (arquivo `.dockerenv` presente), mas:
- Não tem Node.js/npm instalado
- Não tem permissões de administrador
- Não tem sudo disponível
- Usuário limitado: `ssh-user` (uid=2412)

## Estratégia de Deploy Recomendada

### Opção 1: Deploy Tradicional via FTP/SFTP

#### 1. Build Local da Aplicação

No seu computador local, execute:

```bash
# Frontend - Build de produção
cd frontend
npm run build

# Backend - Preparar arquivos
cd ../backend
npm install --production
```

#### 2. Estrutura de Upload

Crie esta estrutura para upload:

```
app/
├── frontend/
│   └── dist/          # Arquivos do build do Vite
├── backend/
│   ├── node_modules/  # Dependências de produção
│   ├── server.js
│   ├── package.json
│   └── healthcheck.js
├── .env               # Variáveis de ambiente
└── start.sh           # Script de inicialização
```

#### 3. Configuração do Backend

Crie um arquivo `start.sh`:

```bash
#!/bin/bash
cd /path/to/your/app/backend
export NODE_ENV=production
export PORT=3000
node server.js
```

### Opção 2: Usar Painel da Umbler

#### Verificar se a Umbler oferece:

1. **Painel de Controle** para aplicações Node.js
2. **Deploy via Git** (GitHub/GitLab integration)
3. **Marketplace de aplicações**
4. **Suporte a Node.js** nativo

### Opção 3: Contatar Suporte da Umbler

#### Perguntas para o suporte:

1. Como fazer deploy de aplicações Node.js?
2. Existe painel de controle para gerenciar aplicações?
3. É possível instalar Node.js no ambiente?
4. Qual a forma recomendada de deploy?
5. Existe integração com Git?

## Comandos para Investigar o Ambiente

Execute estes comandos no SSH para entender melhor o ambiente:

```bash
# Verificar se existe algum gerenciador de pacotes
which apt-get
which yum
which apk

# Verificar se Node.js está em outro local
find /usr -name "node" 2>/dev/null
find /opt -name "node" 2>/dev/null

# Verificar variáveis de ambiente
env | grep -i node
env | grep -i path

# Verificar se existe algum painel web
ls -la /var/www/
ls -la /home/

# Verificar processos rodando
ps aux | grep -i node
ps aux | grep -i apache
ps aux | grep -i nginx

# Verificar portas abertas
netstat -tlnp 2>/dev/null || ss -tlnp
```

## Alternativas de Hospedagem

Se a Umbler não suportar adequadamente Node.js, considere:

### Hospedagem Especializada em Node.js:
- **Heroku** (gratuito limitado)
- **Vercel** (gratuito para projetos pessoais)
- **Netlify** (frontend) + **Railway** (backend)
- **DigitalOcean App Platform**
- **AWS Elastic Beanstalk**

### VPS com Controle Total:
- **DigitalOcean Droplets**
- **Linode**
- **Vultr**
- **AWS EC2**

## Próximos Passos

1. **Execute os comandos de investigação** listados acima
2. **Contate o suporte da Umbler** com as perguntas específicas
3. **Considere as alternativas** se a Umbler não for adequada
4. **Reporte os resultados** para definirmos a melhor estratégia

## Configuração de Banco de Dados

Independente da estratégia escolhida, você precisará:

1. **MySQL na Umbler**: Verificar se oferecem banco MySQL
2. **Banco externo**: Usar serviços como PlanetScale, Railway, ou AWS RDS
3. **Configurar variáveis de ambiente** com as credenciais do banco

---

**Importante**: O ambiente atual da Umbler parece ser muito restritivo para aplicações Node.js. É altamente recomendado verificar com o suporte se eles oferecem soluções específicas para Node.js ou considerar migrar para um provedor mais adequado.