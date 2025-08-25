<?php
// ============================================
// USER REGISTRATION ENDPOINT
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
    $username = trim($input['username'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    
    if (empty($username) || empty($email) || empty($password)) {
        errorResponse('Username, email, and password are required');
    }
    
    if (strlen($password) < 6) {
        errorResponse('Password must be at least 6 characters long');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        errorResponse('Invalid email format');
    }
    
    // Check if user already exists
    global $database;
    
    $existingUserByEmail = $database->getUserByEmail($email);
    if ($existingUserByEmail) {
        errorResponse('Email already registered', 409);
    }
    
    $existingUserByUsername = $database->getUserByUsername($username);
    if ($existingUserByUsername) {
        errorResponse('Username already taken', 409);
    }
    
    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT, ['cost' => BCRYPT_COST]);
    
    // Create user
    $userId = $database->createUser($username, $email, $passwordHash);
    
    // Generate token
    $token = JWT::encode(['userId' => $userId]);
    
    // Update last login
    $database->updateLastLogin($userId);
    
    jsonResponse([
        'message' => 'User registered successfully',
        'user' => [
            'id' => $userId,
            'username' => $username,
            'email' => $email
        ],
        'token' => $token
    ], 201);
    
} catch (Exception $e) {
    error_log('Registration error: ' . $e->getMessage());
    errorResponse('Registration failed', 500);
}
?>