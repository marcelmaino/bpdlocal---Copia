# 🃏 BPD Dashboard - Backend Simplificado

## 📋 Visão Geral

Backend minimalista para o dashboard de poker BPD com:
- ✅ Node.js + Express simples
- ✅ MySQL com dados de exemplo
- ✅ Login básico sem JWT
- ✅ Endpoints essenciais
- ✅ Docker para facilitar desenvolvimento

## 🚀 Como Usar

### 1. Iniciar os Serviços
```bash
docker-compose up -d
```

### 2. Verificar Status
```bash
docker-compose ps
```

### 3. Acessar Serviços
- **Backend API**: http://localhost:5000
- **phpMyAdmin**: http://localhost:8080
- **Frontend**: http://localhost:3000 (quando rodando)

## 🔐 Credenciais Padrão

### Usuários do Sistema
- **Admin**: `admin` / `admin123`
- **Player1**: `player1` / `player123`
- **Player2**: `player2` / `player123`

### Banco de Dados
- **Host**: localhost:3306
- **Usuário**: root
- **Senha**: root123
- **Database**: bpd_database

## 📡 Endpoints da API

### Health Check
```
GET /health
```

### Login
```
POST /login
Body: { "playerName": "admin", "password": "admin123" }
```

### Dados BPD
```
GET /api/bpd-data?startDate=2024-01-15&endDate=2024-01-16&playerName=player1
```

### Métricas
```
GET /api/metrics?playerName=player1
```

### Lista de Jogadores
```
GET /api/players
```

## 🗄️ Estrutura do Banco

Tabela `bpd` com campos:
- `id`, `timestamp`, `playerName`, `handId`
- `position`, `holeCards`, `communityCards`
- `potSize`, `netWinning`, `actionSequence`
- `gameType`, `tableSize`, `blindLevel`

## 🛠️ Comandos Úteis

```bash
# Parar serviços
docker-compose down

# Ver logs do backend
docker-compose logs backend

# Ver logs do MySQL
docker-compose logs mysql

# Reiniciar apenas o backend
docker-compose restart backend

# Reconstruir e iniciar
docker-compose up --build
```

## 📊 Dados de Exemplo

O banco já vem com 15 mãos de exemplo para testar:
- 3 jogadores: admin, player1, player2
- Datas: 15-16 de Janeiro de 2024
- Diferentes posições e resultados

## 🔧 Desenvolvimento

Para modificar o backend:
1. Edite os arquivos em `./backend/`
2. Reinicie: `docker-compose restart backend`
3. Os logs aparecem em: `docker-compose logs -f backend`

**Pronto para usar! 🎉**