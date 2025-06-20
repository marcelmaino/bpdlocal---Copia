<?php
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

try {
    $db = Database::getInstance();
    
    // Parâmetros da query
    $startDate = $_GET['startDate'] ?? '';
    $endDate = $_GET['endDate'] ?? '';
    $playerName = $_GET['playerName'] ?? '';
    $search = $_GET['search'] ?? '';
    $clubs = $_GET['clubs'] ?? '';
    $agents = $_GET['agents'] ?? '';
    $players = $_GET['players'] ?? '';
    $page = (int)($_GET['page'] ?? 1);
    $limit = (int)($_GET['limit'] ?? 50);
    $sortField = $_GET['sortField'] ?? ' dia';
    $sortDirection = $_GET['sortDirection'] ?? 'desc';
    
    // Construir WHERE clause
    $whereClause = 'WHERE 1=1';
    $params = [];
    
    // Filtros de data
    if (!empty(trim($startDate))) {
        $whereClause .= ' AND ` dia` >= ?';
        $params[] = date('Y-m-d', strtotime($startDate));
    }
    
    if (!empty(trim($endDate))) {
        $whereClause .= ' AND ` dia` <= ?';
        $params[] = date('Y-m-d', strtotime($endDate));
    }
    
    // Filtro legacy playerName
    if (!empty($playerName)) {
        $whereClause .= ' AND ` playerName` = ?';
        $params[] = $playerName;
    }
    
    // Filtro de busca global
    if (!empty($search)) {
        $whereClause .= ' AND (` playerName` = ? OR ` agentName` LIKE ? OR ` club` LIKE ?)';
        $searchTerm = '%' . $search . '%';
        $params[] = $search;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
    }
    
    // Filtro de clubes
    if (!empty($clubs)) {
        $clubList = array_map('trim', explode(',', $clubs));
        $clubPlaceholders = str_repeat('?,', count($clubList) - 1) . '?';
        $whereClause .= " AND ` club` IN ($clubPlaceholders)";
        $params = array_merge($params, $clubList);
    }
    
    // Filtro de agentes
    if (!empty($agents)) {
        $agentList = array_map('trim', explode(',', $agents));
        $agentPlaceholders = str_repeat('?,', count($agentList) - 1) . '?';
        $whereClause .= " AND ` agentName` IN ($agentPlaceholders)";
        $params = array_merge($params, $agentList);
    }
    
    // Filtro de jogadores
    if (!empty($players)) {
        $playerList = array_map('trim', explode(',', $players));
        $playerPlaceholders = str_repeat('?,', count($playerList) - 1) . '?';
        $whereClause .= " AND ` playerName` IN ($playerPlaceholders)";
        $params = array_merge($params, $playerList);
    }
    
    // Contar total de registros
    $countQuery = "SELECT COUNT(*) as total FROM bpd $whereClause";
    $total = $db->fetchColumn($countQuery, $params);
    
    // Validar e sanitizar ordenação
    $validSortFields = ['dia', 'playerName', 'agentName', 'club', 'hands', 'realWins'];
    $columnMapping = [
        'dia' => ' dia',
        'playerName' => ' playerName', 
        'agentName' => ' agentName',
        'club' => ' club',
        'hands' => ' hands',
        'realWins' => ' realWins'
    ];
    
    $decodedSortField = urldecode(str_replace('+', ' ', trim($sortField)));
    $validField = in_array($decodedSortField, $validSortFields) ? $decodedSortField : 'dia';
    $safeSortField = $columnMapping[$validField];
    $safeSortDirection = strtoupper($sortDirection) === 'ASC' ? 'ASC' : 'DESC';
    
    // Paginação
    $limitInt = max(1, min(100, $limit)); // Entre 1 e 100
    $pageInt = max(1, $page);
    $offset = ($pageInt - 1) * $limitInt;
    
    // Query principal
    $query = "SELECT * FROM bpd $whereClause ORDER BY `$safeSortField` $safeSortDirection LIMIT $limitInt OFFSET $offset";
    $rows = $db->fetchAll($query, $params);
    
    echo json_encode([
        'success' => true,
        'data' => $rows,
        'total' => (int)$total,
        'page' => $pageInt,
        'limit' => $limitInt,
        'totalPages' => ceil($total / $limitInt)
    ]);
    
} catch (Exception $e) {
    error_log('Erro ao buscar dados BPD: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erro interno do servidor']);
}
?>