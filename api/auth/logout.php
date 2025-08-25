<?php
// ============================================
// USER LOGOUT ENDPOINT
// ============================================

require_once '../config.php';
require_once '../jwt.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

try {
    // Verify token (this will error if token is invalid)
    $payload = authenticateToken();
    
    // In a more advanced system, we could maintain a blacklist of tokens
    // For now, we just return success - client should delete the token
    jsonResponse([
        'message' => 'Logged out successfully'
    ]);
    
} catch (Exception $e) {
    error_log('Logout error: ' . $e->getMessage());
    errorResponse('Logout failed', 500);
}
?>