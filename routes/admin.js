const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const META_DECKS_PATH = path.join(__dirname, '..', 'tools', 'lorcana-mulligan', 'data', 'metadecks.json');

function isAuthenticated(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.substring(7);
    
    try {
        jwt.verify(token, ADMIN_JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }
        
        // Verify password against hash
        const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        // Generate JWT token
        const token = jwt.sign(
            { role: 'admin', timestamp: Date.now() },
            ADMIN_JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true, 
            token: token,
            message: 'Login successful' 
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/metadecks', isAuthenticated, async (req, res) => {
    try {
        const data = await fs.readFile(META_DECKS_PATH, 'utf8');
        const metaDecks = JSON.parse(data);
        res.json(metaDecks);
    } catch (error) {
        console.error('Error reading metadecks:', error);
        res.status(500).json({ error: 'Failed to load meta decks' });
    }
});

router.post('/metadecks', isAuthenticated, async (req, res) => {
    try {
        const { metaDecks } = req.body;
        
        if (!metaDecks || typeof metaDecks !== 'object') {
            return res.status(400).json({ error: 'Invalid meta decks data' });
        }
        
        const backupPath = META_DECKS_PATH + '.backup.' + Date.now();
        try {
            const existingData = await fs.readFile(META_DECKS_PATH, 'utf8');
            await fs.writeFile(backupPath, existingData);
        } catch (err) {
            console.log('No existing file to backup or backup failed:', err.message);
        }
        
        await fs.writeFile(META_DECKS_PATH, JSON.stringify(metaDecks, null, 4));
        
        res.json({ 
            success: true, 
            message: 'Meta decks updated successfully',
            backup: backupPath
        });
    } catch (error) {
        console.error('Error updating metadecks:', error);
        res.status(500).json({ error: 'Failed to update meta decks' });
    }
});

router.get('/stats', isAuthenticated, async (req, res) => {
    try {
        const database = require('../database/database');
        
        const userCountResult = await database.get('SELECT COUNT(*) as count FROM users');
        const sessionCountResult = await database.get('SELECT COUNT(*) as count FROM training_sessions');
        
        const metaDecksData = await fs.readFile(META_DECKS_PATH, 'utf8');
        const metaDecks = JSON.parse(metaDecksData);
        const deckCount = Object.keys(metaDecks).length;
        
        res.json({
            totalUsers: userCountResult?.count || 0,
            totalSessions: sessionCountResult?.count || 0,
            totalMetaDecks: deckCount,
            serverStatus: 'online'
        });
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.json({
            totalUsers: 0,
            totalSessions: 0,
            totalMetaDecks: 0,
            serverStatus: 'error'
        });
    }
});

router.get('/users', isAuthenticated, async (req, res) => {
    try {
        const database = require('../database/database');
        const users = await database.all(
            'SELECT id, username, email, created_at, last_login, is_active FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to load users' });
    }
});

// Get specific user details
router.get('/users/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const database = require('../database/database');
        
        const user = await database.get(
            'SELECT id, username, email, created_at, last_login, is_active, profile_data FROM users WHERE id = ?',
            [id]
        );
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error getting user details:', error);
        res.status(500).json({ error: 'Failed to load user details' });
    }
});

// Update user
router.put('/users/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, is_active } = req.body;
        const database = require('../database/database');

        // Check if user exists
        const existingUser = await database.get('SELECT id FROM users WHERE id = ?', [id]);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if username/email already taken by another user
        if (username) {
            const userWithUsername = await database.get(
                'SELECT id FROM users WHERE username = ? AND id != ?',
                [username, id]
            );
            if (userWithUsername) {
                return res.status(409).json({ error: 'Username already taken' });
            }
        }

        if (email) {
            const userWithEmail = await database.get(
                'SELECT id FROM users WHERE email = ? AND id != ?',
                [email, id]
            );
            if (userWithEmail) {
                return res.status(409).json({ error: 'Email already taken' });
            }
        }

        // Build update query
        const updates = [];
        const values = [];

        if (username !== undefined) {
            updates.push('username = ?');
            values.push(username);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email);
        }
        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        await database.run(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Get updated user
        const updatedUser = await database.get(
            'SELECT id, username, email, created_at, last_login, is_active FROM users WHERE id = ?',
            [id]
        );

        res.json({ 
            success: true, 
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/users/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const database = require('../database/database');

        // Check if user exists
        const existingUser = await database.get('SELECT id, username FROM users WHERE id = ?', [id]);
        if (!existingUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete user (CASCADE will handle related data)
        await database.run('DELETE FROM users WHERE id = ?', [id]);

        res.json({ 
            success: true, 
            message: `User "${existingUser.username}" deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Toggle user active status
router.post('/users/:id/toggle-status', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const database = require('../database/database');

        // Get current user status
        const user = await database.get('SELECT id, username, is_active FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newStatus = !user.is_active;
        
        await database.run(
            'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newStatus ? 1 : 0, id]
        );

        res.json({ 
            success: true, 
            message: `User "${user.username}" ${newStatus ? 'activated' : 'deactivated'} successfully`,
            is_active: newStatus
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ error: 'Failed to toggle user status' });
    }
});

// Get user statistics
router.get('/users/:id/stats', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const database = require('../database/database');

        // Check if user exists
        const user = await database.get('SELECT id, username FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get user statistics
        const stats = await database.get(`
            SELECT 
                COUNT(*) as total_sessions,
                SUM(total_hands) as total_hands_practiced,
                SUM(total_mulligans) as total_mulligans,
                AVG(session_duration) as avg_session_duration,
                MAX(session_date) as last_session_date
            FROM training_sessions 
            WHERE user_id = ?
        `, [id]);

        // Get recent sessions
        const recentSessions = await database.all(`
            SELECT id, deck_name, session_date, total_hands, total_mulligans, session_duration
            FROM training_sessions 
            WHERE user_id = ? 
            ORDER BY session_date DESC 
            LIMIT 10
        `, [id]);

        res.json({
            user: user,
            stats: {
                total_sessions: stats.total_sessions || 0,
                total_hands_practiced: stats.total_hands_practiced || 0,
                total_mulligans: stats.total_mulligans || 0,
                avg_session_duration: stats.avg_session_duration || 0,
                last_session_date: stats.last_session_date
            },
            recent_sessions: recentSessions
        });
    } catch (error) {
        console.error('Error getting user stats:', error);
        res.status(500).json({ error: 'Failed to load user statistics' });
    }
});

// Get user training sessions
router.get('/users/:id/sessions', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const database = require('../database/database');

        // Check if user exists
        const user = await database.get('SELECT id, username FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const offset = (page - 1) * limit;

        // Get sessions with pagination
        const sessions = await database.all(`
            SELECT 
                id, deck_name, session_date, total_hands, total_mulligans,
                total_cards_exchanged, session_duration, notes
            FROM training_sessions 
            WHERE user_id = ? 
            ORDER BY session_date DESC 
            LIMIT ? OFFSET ?
        `, [id, limit, offset]);

        // Get total count for pagination
        const totalResult = await database.get(
            'SELECT COUNT(*) as total FROM training_sessions WHERE user_id = ?',
            [id]
        );

        res.json({
            user: user,
            sessions: sessions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalResult.total,
                pages: Math.ceil(totalResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Error getting user sessions:', error);
        res.status(500).json({ error: 'Failed to load user sessions' });
    }
});

module.exports = router;