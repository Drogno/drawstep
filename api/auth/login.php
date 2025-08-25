<?php
// ============================================
// USER LOGIN ENDPOINT
// ============================================

require_once '../config.php';
require_once '../database.php';
require_once '../jwt.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

try {
    $input = getJsonInput();
    
    // Validation
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        errorResponse('Email and password are required');
    }
    
    // Find user
    global $database;
    $user = $database->getUserByEmail($email);
    
    if (!$user) {
        errorResponse('Invalid credentials', 401);
    }
    
    // Check password
    if (!password_verify($password, $user['password_hash'])) {
        errorResponse('Invalid credentials', 401);
    }
    
    // Check if user is active
    if (!$user['is_active']) {
        errorResponse('Account is disabled', 403);
    }
    
    // Generate token
    $token = JWT::encode(['userId' => $user['id']]);
    
    // Update last login
    $database->updateLastLogin($user['id']);
    
    jsonResponse([
        'message' => 'Login successful',
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'last_login' => $user['last_login']
        ],
        'token' => $token
    ]);
    
} catch (Exception $e) {
    error_log('Login error: ' . $e->getMessage());
    errorResponse('Login failed', 500);
}
?>