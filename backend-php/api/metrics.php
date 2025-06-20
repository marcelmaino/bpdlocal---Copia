<?php
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

try {
    $db = Database::getInstance();
    
    // Parâmetros para filtros
    $startDate = $_GET['startDate'] ?? '';
    $endDate = $_GET['endDate'] ?? '';
    $playerName = $_GET['playerName'] ?? '';
    $search = $_GET['search'] ?? '';
    $clubs = $_GET['clubs'] ?? '';
    $agents = $_GET['agents'] ?? '';
    $players = $_GET['players'] ?? '';
    
    // Construir WHERE clause (mesmo do bpd-data.php)
    $whereClause = 'WHERE 1=1';
    $params = [];
    
    // Filtros de data
    if (!empty(trim($startDate))) {
        $whereClause .= ' AND DATE(` dia`) >= ?';
        $params[] = date('Y-m-d', strtotime($startDate));
    }
    
    if (!empty(trim($endDate))) {
        $whereClause .= ' AND DATE(` dia`) <= ?';
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
    
    // Queries para métricas
    $queries = [
        'totalHands' => "SELECT SUM(` hands`) as count FROM bpd $whereClause",
        'totalWinnings' => "SELECT SUM(` realWins`) as total FROM bpd $whereClause",
        'avgPot' => "SELECT AVG(` realWins`) as avg FROM bpd $whereClause",
        'winRate' => "SELECT 
            COUNT(CASE WHEN ` realWins` > 0 THEN 1 END) as wins,
            COUNT(*) as total
            FROM bpd $whereClause"
    ];
    
    $results = [];
    
    foreach ($queries as $key => $query) {
        $result = $db->fetchOne($query, $params);
        $results[$key] = $result;
    }
    
    $metrics = [
        'totalHands' => (int)($results['totalHands']['count'] ?? 0),
        'totalWinnings' => (float)($results['totalWinnings']['total'] ?? 0),
        'avgPot' => round($results['avgPot']['avg'] ?? 0),
        'winRate' => $results['winRate']['total'] > 0 ? 
            round(($results['winRate']['wins'] / $results['winRate']['total']) * 100) : 0
    ];
    
    echo json_encode([
        'success' => true,
        'metrics' => $metrics,
        'data' => $metrics // Para compatibilidade com dashboard
    ]);
    
} catch (Exception $e) {
    error_log('Erro ao calcular métricas: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erro ao calcular métricas'
    ]);
}
?>