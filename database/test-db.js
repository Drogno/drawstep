// ============================================
// DATABASE TEST SCRIPT
// ============================================
// Test the database setup and basic operations

require('dotenv').config();
const database = require('./database');

async function testDatabase() {
  try {
    console.log('🧪 Testing database setup...\n');

    // Initialize database
    await database.init();

    // Test user creation
    console.log('1. Testing user creation...');
    const testUser = {
      username: 'testuser',
      email: 'test@example.com',
      password_hash: 'hashed_password_here'
    };

    const userId = await database.createUser(testUser);
    console.log(`✅ User created with ID: ${userId}`);

    // Test user retrieval
    const user = await database.getUserById(userId);
    console.log(`✅ User retrieved:`, user.username, user.email);

    // Test session creation
    console.log('\n2. Testing session creation...');
    const sessionData = {
      user_id: userId,
      deck_name: 'Test Amber/Amethyst Deck',
      deck_list: [
        { Name: 'Elsa - Snow Queen', count: 4 },
        { Name: 'Mickey Mouse - Brave Little Tailor', count: 3 }
      ],
      total_hands: 5,
      total_mulligans: 3,
      total_cards_exchanged: 8,
      total_unink_before: 12.5,
      total_unink_after: 10.2,
      total_ink_cost_before: 21.4,
      total_ink_cost_after: 19.8,
      session_duration: 15,
      notes: 'Good practice session'
    };

    const sessionId = await database.createTrainingSession(sessionData);
    console.log(`✅ Session created with ID: ${sessionId}`);

    // Test mulligan history
    console.log('\n3. Testing mulligan history...');
    const mulliganData = {
      session_id: sessionId,
      mulligan_number: 1,
      situation_role: 'otp',
      situation_opponent: 'starter-amber-amethyst',
      hand_before: [
        { Name: 'Elsa - Snow Queen' },
        { Name: 'Mickey Mouse - Brave Little Tailor' },
        { Name: 'Friends on the Other Side' },
        { Name: 'A Whole New World' },
        { Name: 'Pascal - Rapunzel\'s Companion' },
        { Name: 'Cruella De Vil - Miserable as Usual' },
        { Name: 'Belle - Hidden Depths' }
      ],
      hand_after: [
        { Name: 'Elsa - Snow Queen' },
        { Name: 'Mickey Mouse - Brave Little Tailor' },
        { Name: 'Maui - Hero to All' },
        { Name: 'A Whole New World' },
        { Name: 'Pascal - Rapunzel\'s Companion' },
        { Name: 'Cruella De Vil - Miserable as Usual' },
        { Name: 'Belle - Hidden Depths' }
      ],
      cards_exchanged: [false, false, true, false, false, false, false],
      unink_count_before: 2,
      unink_count_after: 1,
      avg_ink_cost_before: 3.2,
      avg_ink_cost_after: 3.8,
      decision_time: 45
    };

    const mulliganId = await database.saveMulliganHistory(mulliganData);
    console.log(`✅ Mulligan history saved with ID: ${mulliganId}`);

    // Test statistics update
    console.log('\n4. Testing statistics update...');
    await database.updateUserStats(userId);
    console.log(`✅ User statistics updated`);

    // Test data retrieval
    console.log('\n5. Testing data retrieval...');
    const sessions = await database.getUserSessions(userId);
    console.log(`✅ Retrieved ${sessions.length} sessions`);

    const history = await database.getSessionHistory(sessionId);
    console.log(`✅ Retrieved ${history.length} mulligan history entries`);

    const leaderboard = await database.getLeaderboard(5);
    console.log(`✅ Retrieved leaderboard with ${leaderboard.length} entries`);

    console.log('\n🎉 All database tests passed!');
    console.log('\nSample session data:', sessions[0]);
    console.log('\nSample history entry:', history[0]);

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await database.close();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testDatabase();
}

module.exports = testDatabase;