<?php
// ============================================
// GET CURRENT USER ENDPOINT
// ============================================

require_once '../config.php';
require_once '../database.php';
require_once '../jwt.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

try {
    // Verify token
    $payload = authenticateToken();
    
    // Get user
    global $database;
    $user = $database->getUserById($payload['userId']);
    
    if (!$user) {
        errorResponse('User not found', 404);
    }
    
    jsonResponse([
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'created_at' => $user['created_at'],
            'last_login' => $user['last_login']
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Get user error: ' . $e->getMessage());
    errorResponse('Failed to get user info', 500);
}
?>