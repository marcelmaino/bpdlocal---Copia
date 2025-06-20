<?php
// Configuração do banco de dados
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASSWORD', $_ENV['DB_PASSWORD'] ?? 'root123');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'bpd_database');
define('DB_PORT', $_ENV['DB_PORT'] ?? 3306);

// Carregar variáveis de ambiente se existir arquivo .env
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        list($name, $value) = explode('=', $line, 2);
        $_ENV[trim($name)] = trim($value);
    }
}

// Usuários padrão (mesmo do Node.js)
$defaultUsers = [
    'admin' => ['password' => 'admin123', 'type' => 'admin'],
    'player1' => ['password' => 'player123', 'type' => 'player'],
    'player2' => ['password' => 'player123', 'type' => 'player']
];
?>