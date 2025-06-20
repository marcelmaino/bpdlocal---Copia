<?php
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

$auth = new Auth();
$token = $auth->getTokenFromHeader();

if (!$token) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Token não fornecido'
    ]);
    exit;
}

$result = $auth->validateToken($token);

if (!$result['success']) {
    http_response_code(401);
}

echo json_encode($result);
?>