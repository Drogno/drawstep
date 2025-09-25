const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const router = express.Router();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'drawstep2024';
const META_DECKS_PATH = path.join(__dirname, '..', 'tools', 'lorcana-mulligan', 'data', 'metadecks.json');

function isAuthenticated(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.substring(7);
    if (token !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid authentication' });
    }
    
    next();
}

router.post('/login', async (req, res) => {
    try {
        const { password } = req.body;
        
        if (!password || password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        res.json({ 
            success: true, 
            token: ADMIN_PASSWORD,
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
        
        const userCountResult = await database.all('SELECT COUNT(*) as count FROM users');
        const sessionCountResult = await database.all('SELECT COUNT(*) as count FROM training_sessions');
        
        const metaDecksData = await fs.readFile(META_DECKS_PATH, 'utf8');
        const metaDecks = JSON.parse(metaDecksData);
        const deckCount = Object.keys(metaDecks).length;
        
        res.json({
            totalUsers: userCountResult[0]?.count || 0,
            totalSessions: sessionCountResult[0]?.count || 0,
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
            'SELECT id, username, email, created_at, last_login FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ error: 'Failed to load users' });
    }
});

module.exports = router;