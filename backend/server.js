const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexão com MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root123',
  database: process.env.DB_NAME || 'bpd_database',
  port: process.env.DB_PORT || 3306
};

let db;

// Conectar ao banco
async function connectDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado ao MySQL');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MySQL:', error.message);
    process.exit(1);
  }
}

// Usuários padrão (simplificado)
const defaultUsers = {
  'admin': { password: 'admin123', type: 'admin' },
  'player1': { password: 'player123', type: 'player' },
  'player2': { password: 'player123', type: 'player' }
};

// Rotas

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend funcionando' });
});

// Login simples
app.post('/login', (req, res) => {
  const { playerName, password } = req.body;
  
  if (!playerName || !password) {
    return res.status(400).json({ error: 'PlayerName e password são obrigatórios' });
  }
  
  const user = defaultUsers[playerName];
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }
  
  res.json({ 
    success: true, 
    user: { playerName, type: user.type },
    message: 'Login realizado com sucesso'
  });
});

// Rota de autenticação para o frontend
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false,
      message: 'Username e password são obrigatórios' 
    });
  }
  
  const user = defaultUsers[username];
  if (!user || user.password !== password) {
    return res.status(401).json({ 
      success: false,
      message: 'Credenciais inválidas' 
    });
  }
  
  // Simular token JWT (em produção usar biblioteca jwt)
  const token = `fake-jwt-token-${username}-${Date.now()}`;
  
  res.json({ 
    success: true,
    data: {
      token,
      user: {
        id: username,
        playerName: username,
        role: user.type
      }
    },
    message: 'Login realizado com sucesso'
  });
});

// Validar token de autenticação
app.get('/api/auth/validate', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ 
      success: false,
      message: 'Token não fornecido' 
    });
  }
  
  const token = authHeader.substring(7);
  
  // Validação simples do token fake (em produção usar biblioteca jwt)
  if (token.startsWith('fake-jwt-token-')) {
    const username = token.split('-')[3];
    const user = defaultUsers[username];
    
    if (user) {
      return res.json({ 
        success: true,
        data: {
          user: {
            id: username,
            playerName: username,
            role: user.type
          }
        }
      });
    }
  }
  
  res.status(401).json({ 
    success: false,
    message: 'Token inválido' 
  });
});

// Buscar dados da tabela BPD
app.get('/api/bpd-data', async (req, res) => {
  try {
    console.log('=== DEBUG: Iniciando rota /api/bpd-data ===');
    console.log('Query params:', req.query);
    
    const { startDate, endDate, playerName, search, clubs, agents, players, page = 1, limit = 50, sortField = ' dia', sortDirection = 'desc' } = req.query;
    
    console.log('Parâmetros extraídos:', { startDate, endDate, playerName, search, clubs, agents, players, page, limit, sortField, sortDirection });
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    console.log('whereClause inicial:', whereClause);
    
    // Date filters
    console.log('StartDate received:', startDate);
    console.log('EndDate received:', endDate);
    
    if (startDate && startDate.trim() !== '') {
      whereClause += ' AND \` dia\` >= ?';
      const startDateFormatted = new Date(startDate).toISOString().split('T')[0];
      console.log('StartDate original:', startDate, 'Formatted:', startDateFormatted);
      params.push(startDateFormatted);
    }
    
    if (endDate && endDate.trim() !== '') {
      whereClause += ' AND \` dia\` <= ?';
      const endDateFormatted = new Date(endDate).toISOString().split('T')[0];
      console.log('EndDate original:', endDate, 'Formatted:', endDateFormatted);
      params.push(endDateFormatted);
    }
    
    // Legacy playerName filter
    if (playerName) {
      whereClause += ' AND \` playerName\` = ?';
      params.push(playerName);
    }
    
    // Global search filter
    if (search) {
      whereClause += ' AND (\` playerName\` = ? OR \` agentName\` LIKE ? OR \` club\` LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(search, searchTerm, searchTerm);
    }
    
    // Clubs filter
    if (clubs) {
      const clubList = clubs.split(',').map(club => club.trim());
      const clubPlaceholders = clubList.map(() => '?').join(',');
      whereClause += ` AND \` club\` IN (${clubPlaceholders})`;
      params.push(...clubList);
    }
    
    // Agents filter
    if (agents) {
      const agentList = agents.split(',').map(agent => agent.trim());
      const agentPlaceholders = agentList.map(() => '?').join(',');
      whereClause += ` AND \` agentName\` IN (${agentPlaceholders})`;
      params.push(...agentList);
    }
    
    // Players filter
    if (players) {
      const playerList = players.split(',').map(player => player.trim());
      const playerPlaceholders = playerList.map(() => '?').join(',');
      whereClause += ` AND \` playerName\` IN (${playerPlaceholders})`;
      params.push(...playerList);
    }
    
    // Get total count with same filters
    const countQuery = `SELECT COUNT(*) as total FROM bpd ${whereClause}`;
    console.log('Count Query:', countQuery);
    console.log('Count Params:', params);
    console.log('Count Params types:', params.map(p => typeof p));
    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;
    
    // Build main query with sorting and pagination
    const validSortFields = ['dia', 'playerName', 'agentName', 'club', 'hands', 'realWins'];
    const columnMapping = {
      'dia': ' dia',
      'playerName': ' playerName', 
      'agentName': ' agentName',
      'club': ' club',
      'hands': ' hands',
      'realWins': ' realWins'
    };
    // Handle URL encoding where space becomes + or %20
    console.log('Original sortField:', sortField);
    const decodedSortField = decodeURIComponent(sortField.replace(/\+/g, ' ')).trim();
    console.log('Decoded sortField:', decodedSortField);
    console.log('Valid sort fields:', validSortFields);
    console.log('Is valid?', validSortFields.includes(decodedSortField));
    const validField = validSortFields.includes(decodedSortField) ? decodedSortField : 'dia';
    const safeSortField = columnMapping[validField];
    const safeSortDirection = sortDirection === 'asc' ? 'ASC' : 'DESC';
    
    const limitInt = parseInt(limit) || 50;
    const pageInt = parseInt(page) || 1;
    const offset = (pageInt - 1) * limitInt;
    
    console.log('Pagination debug:', { page, limit, pageInt, limitInt, offset });
    
    // Create new params array for main query (reuse filters + add pagination)
    const mainQueryParams = [...params, limitInt, offset];
    
    // Ensure all pagination params are valid integers
    if (!Number.isInteger(limitInt) || !Number.isInteger(offset) || limitInt <= 0 || offset < 0) {
      throw new Error(`Invalid pagination parameters: limit=${limitInt}, offset=${offset}`);
    }
    
    // Build query without LIMIT/OFFSET as parameters to avoid MySQL prepared statement issues
    const query = `SELECT * FROM bpd ${whereClause} ORDER BY \`${safeSortField}\` ${safeSortDirection} LIMIT ${limitInt} OFFSET ${offset}`;
    
    console.log('Query:', query);
    console.log('FilterParams:', params);
    console.log('FilterParams types:', params.map(p => typeof p));
    console.log('SafeSortField:', safeSortField);
    console.log('Limit:', limitInt, 'Offset:', offset);
    
    console.log('=== DEBUG QUERY EXECUTION ===');
    console.log('Final Query:', query);
    console.log('Final Params:', params);
    console.log('Param types:', params.map((p, i) => `${i}: ${typeof p} = ${p}`));
    console.log('==============================');
    
    const [rows] = await db.execute(query, params);
    
    res.json({
      success: true,
      data: rows,
      total: total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
    
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Métricas básicas
app.get('/api/metrics', async (req, res) => {
  try {
    const { playerName } = req.query;
    
    let whereClause = '';
    const params = [];
    
    if (playerName) {
      whereClause = 'WHERE \` playerName\` = ?';
      params.push(playerName);
    }
    
    const queries = {
      totalHands: `SELECT SUM(\` hands\`) as count FROM bpd ${whereClause}`,
      totalWinnings: `SELECT SUM(\` realWins\`) as total FROM bpd ${whereClause}`,
      avgPot: `SELECT AVG(\` realWins\`) as avg FROM bpd ${whereClause}`,
      winRate: `SELECT 
        COUNT(CASE WHEN \` realWins\` > 0 THEN 1 END) as wins,
        COUNT(*) as total
        FROM bpd ${whereClause}`
    };
    
    const results = {};
    
    for (const [key, query] of Object.entries(queries)) {
      const [rows] = await db.execute(query, params);
      results[key] = rows[0];
    }
    
    const metrics = {
      totalHands: results.totalHands.count || 0,
      totalWinnings: results.totalWinnings.total || 0,
      avgPot: Math.round(results.avgPot.avg || 0),
      winRate: results.winRate.total > 0 ? 
        Math.round((results.winRate.wins / results.winRate.total) * 100) : 0
    };
    
    res.json({ success: true, metrics });
    
  } catch (error) {
    console.error('Erro ao calcular métricas:', error);
    res.status(500).json({ error: 'Erro ao calcular métricas' });
  }
});

// Lista de jogadores únicos
app.get('/api/players', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT DISTINCT \` playerName\` as playerName FROM bpd WHERE \` playerName\` IS NOT NULL AND \` playerName\` != "" ORDER BY \` playerName\`');
    res.json({ success: true, players: rows.map(row => row.playerName) });
  } catch (error) {
    console.error('Erro ao buscar jogadores:', error);
    res.status(500).json({ error: 'Erro ao buscar jogadores' });
  }
});

// Métricas do dashboard
app.get('/api/dashboard/metrics', async (req, res) => {
  try {
    const { startDate, endDate, playerName, search, clubs, agents, players } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (startDate && startDate.trim() !== '') {
      whereClause += ' AND DATE(\` dia\`) >= ?';
      params.push(startDate);
    }
    
    if (endDate && endDate.trim() !== '') {
      whereClause += ' AND DATE(\` dia\`) <= ?';
      params.push(endDate);
    }
    
    if (playerName) {
      whereClause += ' AND \` playerName\` = ?';
      params.push(playerName);
    }
    
    // Global search filter
    if (search) {
      whereClause += ' AND (\` playerName\` = ? OR \` agentName\` LIKE ? OR \` club\` LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(search, searchTerm, searchTerm);
    }
    
    // Clubs filter
    if (clubs) {
      const clubList = clubs.split(',').map(club => club.trim());
      const clubPlaceholders = clubList.map(() => '?').join(',');
      whereClause += ` AND \` club\` IN (${clubPlaceholders})`;
      params.push(...clubList);
    }
    
    // Agents filter
    if (agents) {
      const agentList = agents.split(',').map(agent => agent.trim());
      const agentPlaceholders = agentList.map(() => '?').join(',');
      whereClause += ` AND \` agentName\` IN (${agentPlaceholders})`;
      params.push(...agentList);
    }
    
    // Players filter
    if (players) {
      const playerList = players.split(',').map(player => player.trim());
      const playerPlaceholders = playerList.map(() => '?').join(',');
      whereClause += ` AND \` playerName\` IN (${playerPlaceholders})`;
      params.push(...playerList);
    }
    
    const queries = {
      totalHands: `SELECT SUM(\` hands\`) as count FROM bpd ${whereClause}`,
      totalWinnings: `SELECT SUM(\` realWins\`) as total FROM bpd ${whereClause}`,
      avgPot: `SELECT AVG(\` realWins\`) as avg FROM bpd ${whereClause}`,
      winRate: `SELECT 
        COUNT(CASE WHEN \` realWins\` > 0 THEN 1 END) as wins,
        COUNT(*) as total
        FROM bpd ${whereClause}`
    };
    
    const results = {};
    
    for (const [key, query] of Object.entries(queries)) {
      const [rows] = await db.execute(query, params);
      results[key] = rows[0];
    }
    
    const metrics = {
      totalHands: results.totalHands.count || 0,
      totalWinnings: results.totalWinnings.total || 0,
      avgPot: Math.round(results.avgPot.avg || 0),
      winRate: results.winRate.total > 0 ? 
        Math.round((results.winRate.wins / results.winRate.total) * 100) : 0
    };
    
    res.json({ success: true, data: metrics });
    
  } catch (error) {
    console.error('Erro ao calcular métricas do dashboard:', error);
    res.status(500).json({ success: false, error: 'Erro ao calcular métricas' });
  }
});

// Filtros do dashboard
app.get('/api/dashboard/filters', async (req, res) => {
  try {
    // Buscar lista de jogadores únicos
    const [playersRows] = await db.execute('SELECT DISTINCT \` playerName\` as playerName FROM bpd WHERE \` playerName\` IS NOT NULL AND \` playerName\` != "" ORDER BY \` playerName\`');
    
    // Buscar lista de clubes únicos
    const [clubsRows] = await db.execute('SELECT DISTINCT \` club\` as clubName FROM bpd WHERE \` club\` IS NOT NULL AND \` club\` != "" ORDER BY \` club\`');
    
    // Buscar lista de agentes únicos
    const [agentsRows] = await db.execute('SELECT DISTINCT \` agentName\` as agentName FROM bpd WHERE \` agentName\` IS NOT NULL AND \` agentName\` != "" ORDER BY \` agentName\`');
    
    // Buscar range de datas
    const [dateRows] = await db.execute('SELECT MIN(DATE(\` dia\`)) as minDate, MAX(DATE(\` dia\`)) as maxDate FROM bpd');
    
    res.json({ 
      success: true, 
      data: {
        players: playersRows.map(row => row.playerName),
        clubs: clubsRows.map(row => row.clubName),
        agents: agentsRows.map(row => row.agentName),
        dateRange: {
          min: dateRows[0].minDate,
          max: dateRows[0].maxDate
        }
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar filtros:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar filtros' });
  }
});

// Iniciar servidor
async function startServer() {
  await connectDB();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:3000`);
    console.log(`🔗 API: http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  if (db) {
    await db.end();
  }
  process.exit(0);
});