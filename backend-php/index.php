<?php
header('Content-Type: application/json');

// CORS configuration for ngrok
$allowedOrigins = [
    'https://631a0f4b518b.ngrok.app',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: https://631a0f4b518b.ngrok.app');
}

header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'classes/Auth.php';
require_once 'classes/Database.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = rtrim($path, '/');

// Remove base path if running in subdirectory
$basePath = '';
if (strpos($path, '/backend-php') === 0) {
    $basePath = '/backend-php';
    $path = substr($path, strlen($basePath));
}

// Simple routing
switch ($path) {
    case '':
    case '/':
        echo json_encode([
            'status' => 'OK',
            'message' => 'Backend PHP funcionando',
            'timestamp' => date('c'),
            'version' => '1.0.0'
        ]);
        break;
        
    case '/health':
    case '/api/health':
        echo json_encode([
            'status' => 'OK',
            'message' => 'Backend funcionando',
            'timestamp' => date('c'),
            'uptime' => time() - $_SERVER['REQUEST_TIME']
        ]);
        break;
        
    case '/login':
    case '/api/auth/login':
        require 'api/auth.php';
        break;
        
    case '/api/auth/validate':
        require 'api/validate.php';
        break;
        
    case '/api/bpd-data':
        require 'api/bpd-data.php';
        break;
        
    case '/api/metrics':
    case '/api/dashboard/metrics':
        require 'api/metrics.php';
        break;
        
    case '/api/players':
        require 'api/players.php';
        break;
        
    case '/api/dashboard/filters':
        require 'api/filters.php';
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Rota não encontrada']);
        break;
}
?>