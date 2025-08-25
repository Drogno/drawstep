<?php
// ============================================
// API CONFIGURATION
// ============================================
// Database and authentication configuration for PHP API

// Database configuration
define('DB_PATH', __DIR__ . '/../database/drawstep.db');

// JWT Configuration
define('JWT_SECRET', 'your-secret-key-here-change-in-production');
define('SESSION_DURATION', 7 * 24 * 60 * 60); // 7 days in seconds

// Password hashing
define('BCRYPT_COST', 10);

// CORS headers for API responses
function setCorsHeaders() {
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    // Handle preflight OPTIONS request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

// JSON response helper
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

// Error response helper
function errorResponse($message, $status = 400) {
    jsonResponse(['error' => $message], $status);
}

// Get JSON input from request body
function getJsonInput() {
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('Invalid JSON input', 400);
    }
    return $input;
}
?>