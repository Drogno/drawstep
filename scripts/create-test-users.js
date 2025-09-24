const bcrypt = require('bcryptjs');
const database = require('../database/database');

async function createTestUsers() {
    try {
        await database.init();
        
        console.log('Creating test users...');
        
        const testUsers = [
            {
                username: 'testuser1',
                email: 'test1@drawstep.de',
                password: 'password123'
            },
            {
                username: 'lorcanaplayer',
                email: 'lorcana@drawstep.de', 
                password: 'lorcana2024'
            },
            {
                username: 'admin_test',
                email: 'admin@drawstep.de',
                password: 'admin123'
            },
            {
                username: 'inactiveuser',
                email: 'inactive@drawstep.de',
                password: 'inactive123'
            },
            {
                username: 'demoplayer',
                email: 'demo@drawstep.de',
                password: 'demo123'
            }
        ];
        
        for (const userData of testUsers) {
            // Check if user already exists
            const existingUser = await database.getUserByEmail(userData.email);
            if (existingUser) {
                console.log(`User ${userData.username} already exists, skipping...`);
                continue;
            }
            
            // Hash password
            const passwordHash = await bcrypt.hash(userData.password, 10);
            
            // Create user
            const userId = await database.createUser({
                username: userData.username,
                email: userData.email,
                password_hash: passwordHash
            });
            
            console.log(`✅ Created user: ${userData.username} (ID: ${userId})`);
            
            // Make the last user inactive for testing
            if (userData.username === 'inactiveuser') {
                await database.run('UPDATE users SET is_active = 0 WHERE id = ?', [userId]);
                console.log(`   → Set ${userData.username} as inactive`);
            }
        }
        
        // Create some test training sessions for the first user
        const firstUser = await database.getUserByEmail('test1@drawstep.de');
        if (firstUser) {
            console.log('\nCreating test training sessions...');
            
            const testSessions = [
                {
                    user_id: firstUser.id,
                    deck_name: 'Ruby Amethyst Control',
                    deck_list: JSON.stringify(['Card 1', 'Card 2', 'Card 3']),
                    total_hands: 15,
                    total_mulligans: 3,
                    total_cards_exchanged: 8,
                    session_duration: 25,
                    notes: 'Good practice session'
                },
                {
                    user_id: firstUser.id,
                    deck_name: 'Amber Steel Aggro',
                    deck_list: JSON.stringify(['Aggro Card 1', 'Aggro Card 2']),
                    total_hands: 20,
                    total_mulligans: 5,
                    total_cards_exchanged: 12,
                    session_duration: 30,
                    notes: 'Testing aggressive mulligans'
                },
                {
                    user_id: firstUser.id,
                    deck_name: 'Emerald Sapphire Ramp',
                    deck_list: JSON.stringify(['Ramp Card 1', 'Ramp Card 2']),
                    total_hands: 10,
                    total_mulligans: 2,
                    total_cards_exchanged: 4,
                    session_duration: 18,
                    notes: 'Ramp deck practice'
                }
            ];
            
            for (const session of testSessions) {
                const sessionId = await database.createTrainingSession(session);
                console.log(`✅ Created session: ${session.deck_name} (ID: ${sessionId})`);
            }
        }
        
        console.log('\n🎉 Test users and sessions created successfully!');
        console.log('\nTest user credentials:');
        console.log('Username: testuser1, Email: test1@drawstep.de, Password: password123');
        console.log('Username: lorcanaplayer, Email: lorcana@drawstep.de, Password: lorcana2024');
        console.log('Username: admin_test, Email: admin@drawstep.de, Password: admin123');
        console.log('Username: inactiveuser, Email: inactive@drawstep.de, Password: inactive123 (INACTIVE)');
        console.log('Username: demoplayer, Email: demo@drawstep.de, Password: demo123');
        
        process.exit(0);
        
    } catch (error) {
        console.error('Error creating test users:', error);
        process.exit(1);
    }
}

createTestUsers();