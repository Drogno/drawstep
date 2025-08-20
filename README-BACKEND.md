# DRAWSTEP Backend Setup

## Installation

1. **Install Node.js** (if not already installed):
   - Download from: https://nodejs.org/
   - Version 16 or higher recommended

2. **Install Dependencies**:
   ```bash
   cd NEW_SERVER_STRUCTURE
   npm install
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   
   Or for production:
   ```bash
   npm start
   ```

## What This Sets Up

- **Express Server** on port 3000
- **Static File Serving** (your existing HTML/CSS/JS files)
- **API Endpoints** for authentication and statistics
- **SQLite Database** (lightweight, no separate installation needed)
- **CORS Support** for API requests from frontend

## Testing the Setup

1. **Install and Start**:
   ```bash
   npm install
   npm run dev
   ```

2. **Test Database**:
   ```bash
   npm run db:test
   ```

3. **Test Application**:
   - Open browser: `http://localhost:3000`
   - Test API: `http://localhost:3000/api/health`
   - Create a test account and try the login system

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user  
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify token

### Statistics  
- `POST /api/stats/session` - Create training session
- `GET /api/stats/sessions` - Get user's sessions
- `GET /api/stats/session/:id` - Get session details
- `POST /api/stats/session/:id/mulligan` - Save mulligan history
- `GET /api/stats/user/stats` - Get user statistics
- `GET /api/stats/leaderboard` - Get global leaderboard

## Next Steps

- [ ] Database setup with user and statistics tables
- [ ] Authentication routes (register/login)  
- [ ] Statistics collection endpoints
- [ ] Frontend integration

## File Structure

```
NEW_SERVER_STRUCTURE/
├── server.js          # Main backend server
├── package.json       # Dependencies and scripts
├── .env              # Configuration (don't commit this!)
├── database/         # SQLite database files
└── [existing files]  # Your current frontend files
```

## Important Notes

- Change the JWT_SECRET in .env for production!
- The .env file contains sensitive information - don't commit it to Git
- Server serves your existing frontend files, so everything works together