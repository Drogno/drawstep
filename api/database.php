<?php
// ============================================
// DATABASE MANAGER (PHP VERSION)
// ============================================
// SQLite database operations for PHP

require_once 'config.php';

class Database {
    private $pdo;
    
    public function __construct() {
        try {
            // Create database directory if it doesn't exist
            $dbDir = dirname(DB_PATH);
            if (!is_dir($dbDir)) {
                mkdir($dbDir, 0755, true);
            }
            
            // Connect to SQLite database
            $this->pdo = new PDO('sqlite:' . DB_PATH);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Enable foreign keys
            $this->pdo->exec('PRAGMA foreign_keys = ON');
            
            // Initialize tables
            $this->createTables();
            
        } catch (PDOException $e) {
            error_log('Database connection error: ' . $e->getMessage());
            errorResponse('Database connection failed', 500);
        }
    }
    
    private function createTables() {
        $schema = file_get_contents(__DIR__ . '/../database/schema.sql');
        
        // Split by semicolon and execute each statement
        $statements = array_filter(array_map('trim', explode(';', $schema)));
        
        foreach ($statements as $statement) {
            if (!empty($statement)) {
                $this->pdo->exec($statement);
            }
        }
    }
    
    // ============================================
    // USER METHODS
    // ============================================
    
    public function createUser($username, $email, $passwordHash) {
        $stmt = $this->pdo->prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
        $stmt->execute([$username, $email, $passwordHash]);
        return $this->pdo->lastInsertId();
    }
    
    public function getUserByEmail($email) {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        return $stmt->fetch();
    }
    
    public function getUserByUsername($username) {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE username = ?');
        $stmt->execute([$username]);
        return $stmt->fetch();
    }
    
    public function getUserById($id) {
        $stmt = $this->pdo->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
    
    public function updateLastLogin($userId) {
        $stmt = $this->pdo->prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
        return $stmt->execute([$userId]);
    }
}

// Singleton instance
$database = new Database();
?>