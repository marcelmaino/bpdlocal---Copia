<?php
class Auth {
    private $defaultUsers;
    
    public function __construct() {
        global $defaultUsers;
        $this->defaultUsers = $defaultUsers;
    }
    
    public function login($username, $password) {
        if (!$username || !$password) {
            return ['success' => false, 'message' => 'Username e password são obrigatórios'];
        }
        
        if (!isset($this->defaultUsers[$username])) {
            return ['success' => false, 'message' => 'Credenciais inválidas'];
        }
        
        $user = $this->defaultUsers[$username];
        if ($user['password'] !== $password) {
            return ['success' => false, 'message' => 'Credenciais inválidas'];
        }
        
        // Simular token JWT (mesmo do Node.js)
        $token = 'fake-jwt-token-' . $username . '-' . time();
        
        return [
            'success' => true,
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $username,
                    'playerName' => $username,
                    'role' => $user['type']
                ]
            ],
            'message' => 'Login realizado com sucesso'
        ];
    }
    
    public function validateToken($token) {
        if (!$token || !str_starts_with($token, 'fake-jwt-token-')) {
            return ['success' => false, 'message' => 'Token inválido'];
        }
        
        $parts = explode('-', $token);
        if (count($parts) < 4) {
            return ['success' => false, 'message' => 'Token inválido'];
        }
        
        $username = $parts[3];
        
        if (!isset($this->defaultUsers[$username])) {
            return ['success' => false, 'message' => 'Token inválido'];
        }
        
        $user = $this->defaultUsers[$username];
        
        return [
            'success' => true,
            'data' => [
                'user' => [
                    'id' => $username,
                    'playerName' => $username,
                    'role' => $user['type']
                ]
            ]
        ];
    }
    
    public function getTokenFromHeader() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }
        
        return substr($authHeader, 7);
    }
}
?>