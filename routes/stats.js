// ============================================
// STATISTICS ROUTES
// ============================================
// Handles session tracking, statistics, and mulligan history

const express = require('express');
const database = require('../database/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// ============================================
// SESSION ROUTES
// ============================================

// Create new training session
router.post('/session', authenticateToken, async (req, res) => {
  try {
    const {
      deck_name,
      deck_list,
      total_hands,
      total_mulligans,
      total_cards_exchanged,
      total_unink_before,
      total_unink_after,
      total_ink_cost_before,
      total_ink_cost_after,
      session_duration,
      notes
    } = req.body;

    const sessionId = await database.createTrainingSession({
      user_id: req.user.userId,
      deck_name,
      deck_list,
      total_hands: total_hands || 0,
      total_mulligans: total_mulligans || 0,
      total_cards_exchanged: total_cards_exchanged || 0,
      total_unink_before: total_unink_before || 0,
      total_unink_after: total_unink_after || 0,
      total_ink_cost_before: total_ink_cost_before || 0,
      total_ink_cost_after: total_ink_cost_after || 0,
      session_duration,
      notes
    });

    // Update user statistics
    await database.updateUserStats(req.user.userId);

    res.status(201).json({
      message: 'Training session created',
      session_id: sessionId
    });

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get user's training sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sessions = await database.getUserSessions(req.user.userId, limit);

    // Parse JSON fields
    const parsedSessions = sessions.map(session => ({
      ...session,
      deck_list: session.deck_list ? JSON.parse(session.deck_list) : null
    }));

    res.json({
      sessions: parsedSessions,
      count: sessions.length
    });

  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
});

// Get specific session details
router.get('/session/:id', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // First check if session belongs to user
    const sessions = await database.getUserSessions(req.user.userId, 1000);
    const session = sessions.find(s => s.id == sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get mulligan history for this session
    const history = await database.getSessionHistory(sessionId);

    // Parse JSON fields
    const parsedHistory = history.map(h => ({
      ...h,
      hand_before: JSON.parse(h.hand_before),
      hand_after: JSON.parse(h.hand_after),
      cards_exchanged: JSON.parse(h.cards_exchanged)
    }));

    res.json({
      session: {
        ...session,
        deck_list: session.deck_list ? JSON.parse(session.deck_list) : null
      },
      mulligan_history: parsedHistory
    });

  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// ============================================
// MULLIGAN HISTORY ROUTES
// ============================================

// Save mulligan history entry
router.post('/session/:id/mulligan', authenticateToken, async (req, res) => {
  try {
    const sessionId = req.params.id;
    
    // Verify session belongs to user
    const sessions = await database.getUserSessions(req.user.userId, 1000);
    const session = sessions.find(s => s.id == sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const {
      mulligan_number,
      situation_role,
      situation_opponent,
      hand_before,
      hand_after,
      cards_exchanged,
      unink_count_before,
      unink_count_after,
      avg_ink_cost_before,
      avg_ink_cost_after,
      decision_time
    } = req.body;

    const mulliganId = await database.saveMulliganHistory({
      session_id: sessionId,
      mulligan_number,
      situation_role,
      situation_opponent,
      hand_before,
      hand_after,
      cards_exchanged,
      unink_count_before,
      unink_count_after,
      avg_ink_cost_before,
      avg_ink_cost_after,
      decision_time
    });

    res.status(201).json({
      message: 'Mulligan history saved',
      mulligan_id: mulliganId
    });

  } catch (error) {
    console.error('Save mulligan error:', error);
    res.status(500).json({ error: 'Failed to save mulligan history' });
  }
});

// ============================================
// USER STATISTICS ROUTES
// ============================================

// Get user's overall statistics
router.get('/user/stats', authenticateToken, async (req, res) => {
  try {
    // Update stats first to ensure they're current
    const stats = await database.updateUserStats(req.user.userId);

    res.json({
      statistics: {
        total_sessions: stats.total_sessions || 0,
        total_hands_practiced: stats.total_hands_practiced || 0,
        total_mulligans: stats.total_mulligans || 0,
        average_session_duration: Math.round((stats.average_session_duration || 0) * 100) / 100,
        average_mulligans_per_session: stats.total_sessions > 0 
          ? Math.round((stats.total_mulligans / stats.total_sessions) * 100) / 100 
          : 0
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// ============================================
// LEADERBOARD ROUTES
// ============================================

// Get global leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await database.getLeaderboard(limit);

    res.json({
      leaderboard: leaderboard.map((entry, index) => ({
        rank: index + 1,
        username: entry.username,
        total_hands_practiced: entry.total_hands_practiced || 0,
        total_sessions: entry.total_sessions || 0,
        average_session_duration: Math.round((entry.average_session_duration || 0) * 100) / 100
      }))
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

module.exports = router;