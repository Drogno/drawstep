// ============================================
// DATABASE MANAGER
// ============================================
// SQLite database initialization and helper functions

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    this.db = null;
  }

  // Initialize database connection and create tables
  async init() {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(process.env.DB_PATH || './database/drawstep.db');
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Connect to database
      this.db = new sqlite3.Database(process.env.DB_PATH || './database/drawstep.db');
      
      console.log('📁 Database connected successfully');

      // Enable foreign keys
      await this.run('PRAGMA foreign_keys = ON');

      // Create tables from schema
      await this.createTables();
      
      console.log('✅ Database tables initialized');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // Create all tables from schema file
  async createTables() {
    try {
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split by semicolon and execute each statement
      const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        await this.run(statement);
      }
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Promisify database.run
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  // Promisify database.get (single row)
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Promisify database.all (multiple rows)
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) console.error('Error closing database:', err);
        else console.log('📁 Database connection closed');
        resolve();
      });
    });
  }

  // ============================================
  // USER METHODS
  // ============================================

  async createUser(userData) {
    const { username, email, password_hash } = userData;
    const result = await this.run(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, password_hash]
    );
    return result.id;
  }

  async getUserByEmail(email) {
    return await this.get('SELECT * FROM users WHERE email = ?', [email]);
  }

  async getUserByUsername(username) {
    return await this.get('SELECT * FROM users WHERE username = ?', [username]);
  }

  async getUserById(id) {
    return await this.get('SELECT * FROM users WHERE id = ?', [id]);
  }

  async updateLastLogin(userId) {
    return await this.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }

  // ============================================
  // SESSION METHODS
  // ============================================

  async createTrainingSession(sessionData) {
    const {
      user_id, deck_name, deck_list, total_hands, total_mulligans,
      total_cards_exchanged, total_unink_before, total_unink_after,
      total_ink_cost_before, total_ink_cost_after, session_duration, notes
    } = sessionData;

    const result = await this.run(`
      INSERT INTO training_sessions (
        user_id, deck_name, deck_list, total_hands, total_mulligans,
        total_cards_exchanged, total_unink_before, total_unink_after,
        total_ink_cost_before, total_ink_cost_after, session_duration, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      user_id, deck_name, JSON.stringify(deck_list), total_hands, total_mulligans,
      total_cards_exchanged, total_unink_before, total_unink_after,
      total_ink_cost_before, total_ink_cost_after, session_duration, notes
    ]);

    return result.id;
  }

  async getUserSessions(userId, limit = 50) {
    return await this.all(`
      SELECT * FROM training_sessions 
      WHERE user_id = ? 
      ORDER BY session_date DESC 
      LIMIT ?
    `, [userId, limit]);
  }

  // ============================================
  // MULLIGAN HISTORY METHODS
  // ============================================

  async saveMulliganHistory(historyData) {
    const {
      session_id, mulligan_number, situation_role, situation_opponent,
      hand_before, hand_after, cards_exchanged, unink_count_before,
      unink_count_after, avg_ink_cost_before, avg_ink_cost_after, decision_time
    } = historyData;

    const result = await this.run(`
      INSERT INTO mulligan_history (
        session_id, mulligan_number, situation_role, situation_opponent,
        hand_before, hand_after, cards_exchanged, unink_count_before,
        unink_count_after, avg_ink_cost_before, avg_ink_cost_after, decision_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      session_id, mulligan_number, situation_role, situation_opponent,
      JSON.stringify(hand_before), JSON.stringify(hand_after), 
      JSON.stringify(cards_exchanged), unink_count_before,
      unink_count_after, avg_ink_cost_before, avg_ink_cost_after, decision_time
    ]);

    return result.id;
  }

  async getSessionHistory(sessionId) {
    return await this.all(`
      SELECT * FROM mulligan_history 
      WHERE session_id = ? 
      ORDER BY mulligan_number ASC
    `, [sessionId]);
  }

  // ============================================
  // STATISTICS METHODS
  // ============================================

  async updateUserStats(userId) {
    // Calculate and update aggregated user statistics
    const stats = await this.get(`
      SELECT 
        COUNT(*) as total_sessions,
        SUM(total_hands) as total_hands_practiced,
        SUM(total_mulligans) as total_mulligans,
        AVG(session_duration) as average_session_duration
      FROM training_sessions 
      WHERE user_id = ?
    `, [userId]);

    await this.run(`
      INSERT OR REPLACE INTO user_stats (
        user_id, total_sessions, total_hands_practiced, 
        total_mulligans, average_session_duration, last_updated
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      userId, stats.total_sessions || 0, stats.total_hands_practiced || 0,
      stats.total_mulligans || 0, stats.average_session_duration || 0
    ]);

    return stats;
  }

  async getLeaderboard(limit = 10) {
    return await this.all(`
      SELECT u.username, us.* 
      FROM user_stats us
      JOIN users u ON us.user_id = u.id
      WHERE u.is_active = 1
      ORDER BY us.total_hands_practiced DESC
      LIMIT ?
    `, [limit]);
  }
}

// Export singleton instance
const database = new Database();
module.exports = database;