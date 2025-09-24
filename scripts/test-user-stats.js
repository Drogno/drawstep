const database = require('../database/database');

async function testUserStats() {
    try {
        await database.init();
        
        console.log('Testing user statistics...');
        
        // Test user 1 stats
        const userId = 1;
        console.log(`\nTesting stats for user ID ${userId}:`);
        
        // Check if user exists
        const user = await database.get('SELECT * FROM users WHERE id = ?', [userId]);
        console.log('User:', user);
        
        // Check training sessions
        const sessions = await database.all('SELECT * FROM training_sessions WHERE user_id = ?', [userId]);
        console.log('Training sessions:', sessions);
        
        // Test the stats query from the API
        const stats = await database.get(`
            SELECT 
                COUNT(*) as total_sessions,
                SUM(total_hands) as total_hands_practiced,
                SUM(total_mulligans) as total_mulligans,
                AVG(session_duration) as avg_session_duration,
                MAX(session_date) as last_session_date
            FROM training_sessions 
            WHERE user_id = ?
        `, [userId]);
        console.log('Stats query result:', stats);
        
        // Get recent sessions
        const recentSessions = await database.all(`
            SELECT id, deck_name, session_date, total_hands, total_mulligans, session_duration
            FROM training_sessions 
            WHERE user_id = ? 
            ORDER BY session_date DESC 
            LIMIT 10
        `, [userId]);
        console.log('Recent sessions:', recentSessions);
        
        // Test the formatted response
        const response = {
            user: user,
            stats: {
                total_sessions: stats.total_sessions || 0,
                total_hands_practiced: stats.total_hands_practiced || 0,
                total_mulligans: stats.total_mulligans || 0,
                avg_session_duration: stats.avg_session_duration || 0,
                last_session_date: stats.last_session_date
            },
            recent_sessions: recentSessions
        };
        
        console.log('\nFormatted API response:');
        console.log(JSON.stringify(response, null, 2));
        
        process.exit(0);
        
    } catch (error) {
        console.error('Error testing user stats:', error);
        process.exit(1);
    }
}

testUserStats();