<?php
// ============================================
// TOKEN VERIFICATION ENDPOINT
// ============================================

require_once '../config.php';
require_once '../jwt.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    errorResponse('Method not allowed', 405);
}

try {
    // Verify token
    $payload = authenticateToken();
    
    jsonResponse([
        'message' => 'Token is valid',
        'userId' => $payload['userId']
    ]);
    
} catch (Exception $e) {
    error_log('Token verification error: ' . $e->getMessage());
    errorResponse('Token verification failed', 500);
}
?>