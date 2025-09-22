const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const database = require('../database/database');

const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || '';
const TOKEN_EXPIRATION = process.env.ADMIN_SESSION_DURATION || '1h';

const META_DECKS_PATH = path.join(
    __dirname,
    '..',
    'tools',
    'lorcana-mulligan',
    'data',
    'metadecks.json'
);

function isPasswordConfigured() {
    return Boolean(ADMIN_PASSWORD_HASH || ADMIN_PASSWORD);
}

async function verifyAdminPassword(password) {
    if (!password) {
        return false;
    }

    if (ADMIN_PASSWORD_HASH) {
        try {
            return await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
        } catch (error) {
            console.error('Failed to compare admin password hash:', error);
            return false;
        }
    }

    return password === ADMIN_PASSWORD;
}

function createAdminToken() {
    if (!ADMIN_JWT_SECRET) {
        throw new Error('ADMIN_JWT_SECRET environment variable is not set.');
    }

    return jwt.sign({ role: 'admin' }, ADMIN_JWT_SECRET, {
        expiresIn: TOKEN_EXPIRATION
    });
}

function authenticateAdmin(req, res, next) {
    if (!ADMIN_JWT_SECRET) {
        return res.status(500).json({ error: 'Admin authentication is not configured.' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);

    try {
        const payload = jwt.verify(token, ADMIN_JWT_SECRET);
        if (payload.role !== 'admin') {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        req.admin = payload;
        next();
    } catch (error) {
        console.error('Admin token verification failed:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

router.post('/login', async (req, res) => {
    try {
        if (!isPasswordConfigured()) {
            return res.status(500).json({ error: 'Admin password is not configured.' });
        }

        const { password } = req.body;
        if (!password || typeof password !== 'string') {
            return res.status(400).json({ error: 'Password is required' });
        }

        const isValid = await verifyAdminPassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = createAdminToken();

        res.json({
            success: true,
            token,
            expiresIn: TOKEN_EXPIRATION
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/metadecks', authenticateAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(META_DECKS_PATH, 'utf8');
        const metaDecks = JSON.parse(data);
        res.json(metaDecks);
    } catch (error) {
        console.error('Error reading meta decks:', error);
        res.status(500).json({ error: 'Failed to load meta decks' });
    }
});

router.post('/metadecks', authenticateAdmin, async (req, res) => {
    try {
        const { metaDecks } = req.body;

        if (!metaDecks || typeof metaDecks !== 'object') {
            return res.status(400).json({ error: 'Invalid meta decks data' });
        }

        const backupPath = `${META_DECKS_PATH}.backup.${Date.now()}`;

        try {
            const existingData = await fs.readFile(META_DECKS_PATH, 'utf8');
            await fs.writeFile(backupPath, existingData);
        } catch (error) {
            console.log('Meta decks backup skipped:', error.message);
        }

        await fs.writeFile(META_DECKS_PATH, JSON.stringify(metaDecks, null, 2));

        res.json({
            success: true,
            message: 'Meta decks updated successfully',
            backup: backupPath
        });
    } catch (error) {
        console.error('Error updating meta decks:', error);
        res.status(500).json({ error: 'Failed to update meta decks' });
    }
});

router.get('/stats', authenticateAdmin, async (req, res) => {
    try {
        const userCountRow = await database.get('SELECT COUNT(*) as count FROM users');
        const sessionCountRow = await database.get('SELECT COUNT(*) as count FROM training_sessions');

        const metaDecksData = await fs.readFile(META_DECKS_PATH, 'utf8');
        const metaDecks = JSON.parse(metaDecksData);

        res.json({
            totalUsers: userCountRow?.count || 0,
            totalSessions: sessionCountRow?.count || 0,
            totalMetaDecks: Object.keys(metaDecks).length,
            serverStatus: 'online'
        });
    } catch (error) {
        console.error('Error getting admin stats:', error);
        res.status(500).json({
            totalUsers: 0,
            totalSessions: 0,
            totalMetaDecks: 0,
            serverStatus: 'error'
        });
    }
});

router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const users = await database.all(
            'SELECT id, username, email, created_at, last_login FROM users ORDER BY created_at DESC'
        );

        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to load users' });
    }
});

module.exports = router;


