# Sistema Dashboard Poker - Guia de Desenvolvimento Simplificado

## 🎯 OBJETIVO PRINCIPAL
Desenvolver um dashboard web para controle financeiro e gestão de performance de jogadores de poker, com interface responsiva e dois níveis de acesso distintos.

---

## 📋 FASES DE DESENVOLVIMENTO

### **FASE 1 - MVP (Mínimo Produto Viável)**
**Prazo estimado: 2-3 semanas**

#### Funcionalidades Essenciais:
- ✅ Autenticação básica (admin + jogadores)
- ✅ Dashboard com 5 cards principais de métricas
- ✅ Tabela de dados com paginação básica
- ✅ Filtros essenciais (data e moeda)
- ✅ Layout responsivo básico

#### Entregáveis:
- Sistema funcional com dados reais
- Login seguro para ambos tipos de usuário
- Visualização de métricas principais
- Interface responsiva básica

### **FASE 2 - Funcionalidades Avançadas**
**Prazo estimado: 2-3 semanas**

#### Funcionalidades:
- ✅ Gráficos interativos (evolução temporal)
- ✅ Filtros múltiplos (clube, agente, jogador)
- ✅ Exportação de dados (PDF/Excel)
- ✅ Busca avançada na tabela
- ✅ Seleção de colunas visíveis

### **FASE 3 - IA e Analytics**
**Prazo estimado: 3-4 semanas**

#### Funcionalidades:
- ✅ Análises automáticas com IA
- ✅ Insights e recomendações
- ✅ Previsões de performance
- ✅ Alertas de variações significativas

---

## 👥 SISTEMA DE USUÁRIOS SIMPLIFICADO

### **Administrador**
```
Login: admin
Senha: adm121456
Permissões: Acesso total a todos os dados
```

### **Jogadores**
```
Login: [playerName da base de dados]
Senha padrão: "poker2025"
Permissões: Apenas dados próprios
Obrigatório: Mudança de senha no primeiro login
```

### **Script de Criação de Usuários**
```sql
-- Criar tabela de usuários
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  user_type ENUM('admin', 'player') NOT NULL,
  player_name VARCHAR(255),
  first_login BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir admin padrão
INSERT INTO users (username, password_hash, user_type) 
VALUES ('admin', '$2b$10$hashedpassword', 'admin');

-- Script para criar usuários baseado em playerName
INSERT INTO users (username, password_hash, user_type, player_name)
SELECT DISTINCT 
  playerName,
  '$2b$10$defaulthashedpassword', -- hash de "poker2025"
  'player',
  playerName
FROM bpd 
WHERE playerName IS NOT NULL;
```

---

## 🛠 STACK TECNOLÓGICO SIMPLIFICADO

### **Frontend**
```json
{
  "framework": "React 18 + TypeScript",
  "styling": "Tailwind CSS v4",
  "ui-components": "shadcn/ui",
  "charts": "Recharts",
  "tables": "TanStack Table",
  "forms": "React Hook Form + Zod",
  "state": "Zustand",
  "routing": "React Router v6"
}
```

### **Backend**
```json
{
  "runtime": "Node.js 18+",
  "framework": "Express.js",
  "database": "MySQL 8.0",
  "orm": "Prisma",
  "auth": "JWT + bcrypt",
  "validation": "Zod",
  "cors": "cors middleware"
}
```

### **DevOps**
```json
{
  "containerization": "Docker + Docker Compose",
  "database-admin": "phpMyAdmin",
  "environment": "dotenv"
}
```

---

## 📊 ESTRUTURA DE DADOS ESSENCIAL

### **Campos Obrigatórios para MVP**
```sql
-- Campos essenciais da tabela bpd
SELECT 
  dia,                    -- Data do registro
  playerName,             -- Nome do jogador
  club,                   -- Clube
  agentName,              -- Nome do agente
  hands,                  -- Número de mãos
  realWins,               -- Ganhos em Real
  realFee,                -- Taxa em Real
  realRakeback,           -- Rakeback em Real
  dolarWins,              -- Ganhos em Dólar
  dolarFee,               -- Taxa em Dólar
  dolarRakeback           -- Rakeback em Dólar
FROM bpd;
```

### **Campos Opcionais (Fase 2)**
- Todos os demais campos da tabela original
- Campos calculados e derivados

---

## 🎨 LAYOUT E COMPONENTES

### **Estrutura Visual**
```
┌─────────────────────────────────────────────────────────┐
│ Header (Logo + User Info + Logout)                     │
├─────────────────────────────────────────────────────────┤
│ Filtros de Data e Moeda                                │
├─────────────────────────────────────────────────────────┤
│ Cards de Métricas (5 cards em linha)                   │
│ [Mãos] [Ganhos] [Taxas] [Rakeback] [Balanço]          │
├─────────────────────────────────────────────────────────┤
│ Filtros Avançados (colapsável)                         │
├─────────────────────────────────────────────────────────┤
│ Tabela de Registros (paginada)                         │
└─────────────────────────────────────────────────────────┘
```

### **Cores e Estilo**
```css
:root {
  --bg-primary: #f5f7fa;
  --card-blue: #3b82f6;
  --card-green: #10b981;
  --card-yellow: #f59e0b;
  --card-purple: #8b5cf6;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
}
```

---

## 📱 RESPONSIVIDADE SIMPLIFICADA

### **Breakpoints**
```css
/* Desktop: >= 1024px */
.desktop {
  grid-template-columns: repeat(5, 1fr); /* Cards em linha */
}

/* Tablet: 768px - 1023px */
.tablet {
  grid-template-columns: repeat(2, 1fr); /* Cards 2x2 + 1 */
}

/* Mobile: < 768px */
.mobile {
  grid-template-columns: 1fr; /* Cards empilhados */
}
```

### **Adaptações por Dispositivo**
- **Desktop**: Layout completo
- **Tablet**: Menu lateral colapsável, cards em grid 2x2
- **Mobile**: Cards empilhados, filtros em modal, tabela com scroll horizontal

---

## 🔐 AUTENTICAÇÃO E SEGURANÇA

### **Fluxo de Autenticação**
```javascript
// 1. Login
POST /api/auth/login
{
  "username": "playerName ou admin",
  "password": "senha"
}

// 2. Resposta
{
  "token": "jwt_token",
  "user": {
    "id": 1,
    "username": "admin",
    "type": "admin",
    "firstLogin": false
  }
}

// 3. Middleware de proteção
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

### **Medidas de Segurança**
- Senhas hasheadas com bcrypt (salt rounds: 12)
- JWT com expiração de 24h
- CORS configurado adequadamente
- Validação de entrada com Zod
- Rate limiting para login
- HTTPS obrigatório em produção

---

## 📈 MÉTRICAS E CÁLCULOS

### **Cards Principais**
```javascript
// 1. Total de Mãos
const totalHands = data.reduce((sum, record) => sum + record.hands, 0);

// 2. Ganhos (por moeda selecionada)
const totalWins = currency === 'real' 
  ? data.reduce((sum, record) => sum + record.realWins, 0)
  : data.reduce((sum, record) => sum + record.dolarWins, 0);

// 3. Taxas
const totalFees = currency === 'real'
  ? data.reduce((sum, record) => sum + record.realFee, 0)
  : data.reduce((sum, record) => sum + record.dolarFee, 0);

// 4. Rakeback
const totalRakeback = currency === 'real'
  ? data.reduce((sum, record) => sum + record.realRakeback, 0)
  : data.reduce((sum, record) => sum + record.dolarRakeback, 0);

// 5. Balanço Final
const finalBalance = totalWins - totalFees + totalRakeback;
```

---

## 🗂 ESTRUTURA DE ARQUIVOS

```
bpdlocal/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   └── dataController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   └── data.js
│   │   ├── utils/
│   │   │   └── database.js
│   │   └── server.js
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn components
│   │   │   ├── Dashboard/
│   │   │   ├── Auth/
│   │   │   └── Layout/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── utils/
│   │   └── types/
│   ├── package.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── docker-compose.yml
├── init.sql
└── README.md
```

---

## 📥 IMPORTAÇÃO DO BANCO DE DADOS EXISTENTE

### **PASSO OBRIGATÓRIO ANTES DO DESENVOLVIMENTO**

Antes de iniciar qualquer desenvolvimento, é essencial importar o banco de dados real para análise completa da estrutura e dados.

#### **1. Preparação do Ambiente**
```bash
# Subir apenas o MySQL e phpMyAdmin
docker-compose up -d mysql phpmyadmin
```

#### **2. Importação do Dump**
```bash
# Método 1: Via phpMyAdmin
# Acesse http://localhost:8080
# Login: root / senha: root_password
# Importe o arquivo .sql via interface

# Método 2: Via linha de comando
docker-compose exec mysql mysql -u root -p bpd_database < /caminho/para/dump.sql
```

#### **3. Análise da Estrutura Real**
```sql
-- Verificar estrutura da tabela
DESCRIBE bpd;

-- Verificar dados de exemplo
SELECT * FROM bpd LIMIT 10;

-- Verificar campos únicos para usuários
SELECT DISTINCT playerName FROM bpd WHERE playerName IS NOT NULL;

-- Verificar clubes disponíveis
SELECT DISTINCT club FROM bpd WHERE club IS NOT NULL;

-- Verificar agentes disponíveis
SELECT DISTINCT agentName FROM bpd WHERE agentName IS NOT NULL;

-- Verificar range de datas
SELECT MIN(dia) as data_inicial, MAX(dia) as data_final FROM bpd;
```

#### **4. Documentação dos Dados Reais**
Após a importação, documentar:
- ✅ Estrutura exata da tabela `bpd`
- ✅ Tipos de dados de cada campo
- ✅ Valores únicos para criação de usuários
- ✅ Ranges de valores para validações
- ✅ Padrões de dados para filtros
- ✅ Campos com valores nulos ou vazios

#### **5. Ajustes no Desenvolvimento**
Com base nos dados reais, ajustar:
- Validações de entrada
- Filtros disponíveis
- Cálculos de métricas
- Estrutura de usuários
- Queries de performance

---

## 🚀 ROTEIRO DE IMPLEMENTAÇÃO

### **Semana 0: Análise de Dados (OBRIGATÓRIA)**
1. **Dia 1**: Importação do banco real
2. **Dia 2**: Análise completa da estrutura
3. **Dia 3**: Documentação dos padrões encontrados
4. **Dia 4**: Ajustes no planejamento baseado nos dados reais

### **Semana 1-2: Setup e MVP**
1. **Dia 1-2**: Setup do ambiente Docker com dados reais
2. **Dia 3-4**: Backend básico (auth + API de dados)
3. **Dia 5-7**: Frontend básico (login + dashboard)
4. **Dia 8-10**: Integração e testes com dados reais
5. **Dia 11-14**: Refinamentos e responsividade

### **Semana 3-4: Funcionalidades Avançadas**
1. **Dia 15-17**: Implementação de gráficos
2. **Dia 18-20**: Filtros avançados
3. **Dia 21-23**: Exportação de dados
4. **Dia 24-28**: Testes e otimizações

### **Semana 5-8: IA e Analytics (Opcional)**
1. **Semana 5**: Análise de padrões
2. **Semana 6**: Implementação de insights
3. **Semana 7**: Sistema de recomendações
4. **Semana 8**: Testes finais e deploy

---

## 📋 CHECKLIST DE DESENVOLVIMENTO

### **Pré-Requisitos (Semana 0)**
- [ ] Banco de dados real exportado e disponível
- [ ] Docker environment configurado
- [ ] MySQL e phpMyAdmin funcionando
- [ ] Dump do banco real importado com sucesso
- [ ] Estrutura da tabela `bpd` analisada e documentada
- [ ] Campos únicos para usuários identificados
- [ ] Clubes e agentes disponíveis mapeados
- [ ] Range de datas dos dados identificado
- [ ] Padrões de dados documentados
- [ ] Ajustes no planejamento realizados

### **MVP (Fase 1)**
- [ ] Tabela de usuários criada baseada nos dados reais
- [ ] API de autenticação com dados reais
- [ ] API de dados básica funcionando com banco real
- [ ] Interface de login testada com usuários reais
- [ ] Dashboard com 5 cards calculando métricas reais
- [ ] Tabela de dados exibindo registros reais
- [ ] Filtros de data e moeda funcionando com dados reais
- [ ] Layout responsivo básico
- [ ] Testes de integração com dados reais
- [ ] Validação com usuários finais

### **Funcionalidades Avançadas (Fase 2)**
- [ ] Gráficos com Recharts
- [ ] Filtros múltiplos
- [ ] Busca avançada
- [ ] Exportação PDF/Excel
- [ ] Seleção de colunas
- [ ] Paginação avançada
- [ ] Otimização de performance

### **IA e Analytics (Fase 3)**
- [ ] Análise de padrões
- [ ] Sistema de insights
- [ ] Recomendações automáticas
- [ ] Previsões de performance
- [ ] Alertas inteligentes

---

## 🎯 BENEFÍCIOS DA ABORDAGEM SIMPLIFICADA

1. **⚡ Desenvolvimento Mais Rápido**
   - Foco no essencial primeiro
   - Iterações rápidas com feedback
   - Menos complexidade inicial

2. **🧹 Código Mais Limpo**
   - Stack moderna e enxuta
   - Menos dependências
   - Arquitetura clara

3. **🔧 Manutenção Facilitada**
   - Componentes bem definidos
   - Separação clara de responsabilidades
   - Documentação organizada

4. **🧪 Testes Mais Simples**
   - Menos pontos de falha
   - Funcionalidades isoladas
   - Cobertura incremental

5. **🚀 Deploy Mais Fácil**
   - Configuração Docker simplificada
   - Menos variáveis de ambiente
   - Processo de build otimizado

---

## 📞 PRÓXIMOS PASSOS

### **IMEDIATOS (Antes de Começar)**
1. **Preparar Dump do Banco**: 
   - Colocar o arquivo `.sql` exportado na pasta raiz do projeto (`c:\projetos\bpdlocal\`)
   - Renomear para `database-dump.sql` para padronização

2. **Importar Dados Reais**:
   ```bash
   # Subir ambiente
   docker-compose up -d mysql phpmyadmin
   
   # Aguardar MySQL inicializar (30-60 segundos)
   
   # Importar via linha de comando
   docker-compose exec mysql mysql -u root -p bpd_database < database-dump.sql
   
   # OU via phpMyAdmin em http://localhost:8080
   ```

3. **Analisar Estrutura Real**:
   - Executar queries de análise fornecidas no guia
   - Documentar descobertas em arquivo `analise-dados-reais.md`
   - Ajustar planejamento baseado nos dados encontrados

### **DESENVOLVIMENTO**
4. **Validar Requisitos**: Confirmar se o MVP atende às necessidades básicas
5. **Setup Inicial**: Configurar ambiente de desenvolvimento com dados reais
6. **Implementar MVP**: Focar nas funcionalidades essenciais
7. **Testar com Dados Reais**: Validar com usuários reais
8. **Iterar**: Adicionar funcionalidades baseado no feedback
9. **Escalar**: Implementar fases 2 e 3 conforme necessidade

---

*Este guia serve como roadmap completo para o desenvolvimento do sistema de dashboard de poker, priorizando simplicidade, eficiência e entrega de valor incremental.*