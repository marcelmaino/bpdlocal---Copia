<?php
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

try {
    $db = Database::getInstance();
    
    // Buscar lista de jogadores únicos
    $playersQuery = 'SELECT DISTINCT ` playerName` as playerName FROM bpd WHERE ` playerName` IS NOT NULL AND ` playerName` != "" ORDER BY ` playerName`';
    $playersRows = $db->fetchAll($playersQuery);
    
    // Buscar lista de clubes únicos
    $clubsQuery = 'SELECT DISTINCT ` club` as clubName FROM bpd WHERE ` club` IS NOT NULL AND ` club` != "" ORDER BY ` club`';
    $clubsRows = $db->fetchAll($clubsQuery);
    
    // Buscar lista de agentes únicos
    $agentsQuery = 'SELECT DISTINCT ` agentName` as agentName FROM bpd WHERE ` agentName` IS NOT NULL AND ` agentName` != "" ORDER BY ` agentName`';
    $agentsRows = $db->fetchAll($agentsQuery);
    
    // Buscar range de datas
    $dateQuery = 'SELECT MIN(DATE(` dia`)) as minDate, MAX(DATE(` dia`)) as maxDate FROM bpd';
    $dateRow = $db->fetchOne($dateQuery);
    
    $players = array_map(function($row) {
        return $row['playerName'];
    }, $playersRows);
    
    $clubs = array_map(function($row) {
        return $row['clubName'];
    }, $clubsRows);
    
    $agents = array_map(function($row) {
        return $row['agentName'];
    }, $agentsRows);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'players' => $players,
            'clubs' => $clubs,
            'agents' => $agents,
            'dateRange' => [
                'min' => $dateRow['minDate'],
                'max' => $dateRow['maxDate']
            ]
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Erro ao buscar filtros: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erro ao buscar filtros'
    ]);
}
?>