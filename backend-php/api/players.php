<?php
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

try {
    $db = Database::getInstance();
    
    $query = 'SELECT DISTINCT ` playerName` as playerName FROM bpd WHERE ` playerName` IS NOT NULL AND ` playerName` != "" ORDER BY ` playerName`';
    $rows = $db->fetchAll($query);
    
    $players = array_map(function($row) {
        return $row['playerName'];
    }, $rows);
    
    echo json_encode([
        'success' => true,
        'players' => $players
    ]);
    
} catch (Exception $e) {
    error_log('Erro ao buscar jogadores: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Erro ao buscar jogadores']);
}
?>