# Backend PHP - BPD Dashboard

Este é o backend PHP que substitui o backend Node.js original, mantendo todas as funcionalidades.

## Estrutura do Projeto

```
backend-php/
├── index.php              # Arquivo principal com roteamento
├── config/
│   └── database.php       # Configuração do banco de dados
├── classes/
│   ├── Database.php       # Classe de conexão com MySQL
│   └── Auth.php          # Classe de autenticação
├── api/
│   ├── auth.php          # Login de usuários
│   ├── validate.php      # Validação de token
│   ├── bpd-data.php      # Dados da tabela BPD com filtros
│   ├── metrics.php       # Métricas e estatísticas
│   ├── players.php       # Lista de jogadores
│   └── filters.php       # Filtros do dashboard
├── .htaccess             # Configuração Apache
├── Dockerfile            # Container Docker
├── .env.example          # Exemplo de variáveis de ambiente
└── README.md             # Este arquivo
```

## APIs Disponíveis

### Autenticação
- `POST /login` ou `POST /api/auth/login` - Login de usuário
- `GET /api/auth/validate` - Validar token de autenticação

### Dados
- `GET /api/bpd-data` - Buscar dados da tabela BPD com filtros
- `GET /api/metrics` ou `GET /api/dashboard/metrics` - Métricas e estatísticas
- `GET /api/players` - Lista de jogadores únicos
- `GET /api/dashboard/filters` - Filtros disponíveis (jogadores, clubes, agentes, datas)

### Sistema
- `GET /health` ou `GET /api/health` - Health check

## Usuários Padrão

- **admin** / admin123 (tipo: admin)
- **player1** / player123 (tipo: player)
- **player2** / player123 (tipo: player)

## Como Usar

### Com Docker (Recomendado)

1. Certifique-se que o `docker-compose.yml` está configurado para usar o backend PHP
2. Execute:
   ```bash
   docker-compose up -d
   ```

### Sem Docker

1. Configure um servidor Apache com PHP 8.2+
2. Instale as extensões: `pdo`, `pdo_mysql`, `mysqli`
3. Configure as variáveis de ambiente no `.env`
4. Aponte o DocumentRoot para a pasta `backend-php`

## Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```env
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=root123
DB_NAME=bpd_database
DB_PORT=3306
```

## Diferenças do Node.js

- **Linguagem**: PHP ao invés de JavaScript
- **Servidor**: Apache ao invés de Express
- **Dependências**: Nenhuma dependência externa (usa apenas PHP nativo)
- **Performance**: Mesma funcionalidade, possivelmente mais rápido para operações de banco
- **Hospedagem**: Mais opções de hospedagem barata

## Funcionalidades Mantidas

✅ Todas as rotas da API original
✅ Sistema de autenticação com tokens fake
✅ Filtros avançados (data, jogador, clube, agente)
✅ Paginação e ordenação
✅ Métricas e estatísticas
✅ CORS configurado
✅ Health checks
✅ Compatibilidade total com o frontend React

## Logs e Debug

Os logs de erro são gravados no log padrão do PHP. Para debug, verifique:
- Logs do Apache: `/var/log/apache2/error.log`
- Logs do PHP: configurado via `error_log()`