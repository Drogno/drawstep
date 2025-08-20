-- ============================================
-- DRAWSTEP DATABASE SCHEMA
-- ============================================
-- SQLite database schema for user system and statistics

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1,
    profile_data JSON -- For future features like avatar, preferences, etc.
);

-- Training sessions table
CREATE TABLE IF NOT EXISTS training_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    deck_name VARCHAR(100),
    deck_list TEXT, -- JSON string of the deck
    total_hands INTEGER DEFAULT 0,
    total_mulligans INTEGER DEFAULT 0,
    total_cards_exchanged INTEGER DEFAULT 0,
    total_unink_before REAL DEFAULT 0,
    total_unink_after REAL DEFAULT 0,
    total_ink_cost_before REAL DEFAULT 0,
    total_ink_cost_after REAL DEFAULT 0,
    session_duration INTEGER, -- in minutes
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Individual mulligan history within sessions
CREATE TABLE IF NOT EXISTS mulligan_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    mulligan_number INTEGER NOT NULL, -- 1st mulligan, 2nd mulligan, etc.
    situation_role VARCHAR(10), -- 'otp' or 'otd'
    situation_opponent VARCHAR(100), -- opponent deck or 'unknown'
    hand_before TEXT NOT NULL, -- JSON array of cards before mulligan
    hand_after TEXT NOT NULL, -- JSON array of cards after mulligan
    cards_exchanged TEXT NOT NULL, -- JSON array of boolean values (which cards were exchanged)
    unink_count_before INTEGER,
    unink_count_after INTEGER,
    avg_ink_cost_before REAL,
    avg_ink_cost_after REAL,
    decision_time INTEGER, -- time taken to make mulligan decision in seconds
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES training_sessions(id) ON DELETE CASCADE
);

-- User achievements/badges (for gamification)
CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_code VARCHAR(50) NOT NULL, -- e.g. 'perfect_hand', 'meta_master'
    achievement_data JSON, -- Additional data about the achievement
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, achievement_code)
);

-- Global statistics for leaderboards
CREATE TABLE IF NOT EXISTS user_stats (
    user_id INTEGER PRIMARY KEY,
    total_sessions INTEGER DEFAULT 0,
    total_hands_practiced INTEGER DEFAULT 0,
    total_mulligans INTEGER DEFAULT 0,
    average_session_duration REAL DEFAULT 0,
    best_mulligan_streak INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    favorite_deck VARCHAR(100),
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_mulligan_history_session_id ON mulligan_history(session_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_hands ON user_stats(total_hands_practiced DESC);