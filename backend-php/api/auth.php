<?php
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

// Suportar tanto playerName/password quanto username/password
$username = $input['username'] ?? $input['playerName'] ?? '';
$password = $input['password'] ?? '';

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Username/PlayerName e password são obrigatórios'
    ]);
    exit;
}

$auth = new Auth();
$result = $auth->login($username, $password);

if (!$result['success']) {
    http_response_code(401);
}

echo json_encode($result);
?>