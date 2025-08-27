# CLAUDE.md - Development Notes & Feature Roadmap

## Project Overview
DRAWSTEP - TCG tools and websites for Trading Card Games, specifically focused on Lorcana.

### Current Structure
- **Main Project**: Lorcana Mulligan Trainer (`tools/lorcana-mulligan/`)
- **Future**: Tournament tracker app (separate project)

## Recent Completed Features
- [x] Separated CSS and JS from HTML files
- [x] Professional server structure for deployment  
- [x] Ink curve visualization for current hand
- [x] Dynamic mulligan button text (shows "Mulligan X cards")
- [x] English translation (changed from German)
- [x] Correct Lorcana terminology (ink instead of mana)
- [x] Average ink cost statistics (before/after mulligan)
- [x] **Login System**: Complete user authentication with JWT tokens
- [x] **Database Integration**: SQLite with user accounts, sessions, and statistics
- [x] **Session Tracking**: Detailed training session and mulligan history storage
- [x] **Statistics API**: Full backend API for data collection and analysis
- [x] **Admin Panel**: Complete admin interface with meta deck management
- [x] **VPS Deployment**: Full production deployment on Netcup VPS
- [x] **Meta Deck Management**: Add/Edit/Delete/Reorder meta decks via admin panel
- [x] **Font Fixes**: Corrected Bebas Neue font loading
- [x] **UI Improvements**: Added Mulli logo, disclaimer page, footer updates
- [x] **Legal Pages**: Added disclaimer page with proper trademark notices

## Feature Roadmap

### High Priority
- [x] **Login System & User Accounts** (Foundation for Community Platform):
  - [x] User registration and authentication
  - [x] Persistent statistics storage
  - [ ] Cross-device synchronization
  - [ ] User profiles with avatars/badges
  - [ ] Email verification and password reset
  - [ ] Privacy settings and data management

- [ ] **Meta Gauntlet Mode**: 
  - Automatically cycle through all current meta decks as opponents
  - Matchup-specific mulligan practice
  - Blind meta practice (random opponent, unknown deck until hand is drawn)

- [ ] **Gamification Features** (requires login):
  - Achievement system (e.g., "Perfect Mulligan", "Meta Slayer")
  - XP/Level system based on practice sessions
  - Leaderboards for community competition
  - Daily challenges and goals
  - Streak tracking (consecutive good mulligans)

### Medium Priority
- [ ] Card tooltips with full card text on hover
- [ ] Deck import from popular sites (Dreamborn, Lorcania etc.)
- [ ] Mobile optimization for touch devices
- [ ] Dark/Light theme toggle

### Community Platform Features (Long-term Vision)
- [ ] **Social Features**:
  - Friend system and friend lists
  - Share decks and mulligan sessions
  - Community deck ratings and reviews
  - User-generated content (guides, tips)
  
- [ ] **Community Challenges**:
  - Weekly/Monthly community challenges
  - Global leaderboards and tournaments
  - Deck building contests
  - Community meta analysis and insights

- [ ] **Content Creation Tools**:
  - Deck builder with sharing capabilities
  - Mulligan replay system for educational content
  - Community guides and strategy articles
  - Video integration for content creators

### Low Priority / Future Ideas
- [ ] Ink curve comparison (ideal vs current hand)  
- [ ] Turn simulation (first 3-4 turns)
- [ ] Card synergy analysis
- [ ] Win rate prediction based on hand composition
- [ ] Tournament day simulation with realistic conditions

## Technical Notes
- Uses vanilla HTML/CSS/JavaScript (no frameworks)
- **Production Server**: Node.js/Express backend on Netcup VPS
- **Database**: SQLite for user accounts and statistics
- **Admin Panel**: Complete backend management interface
- Card data from `allCards.json` 
- Image mapping via `cardImageMap.js`
- **Live URL**: http://drawstep.de
- Git repository: https://github.com/Drogno/drawstep

## Development Commands
- **Local Development**: `npm run dev` (starts Node.js server)
- **Production**: `pm2 start server.js --name drawstep-backend`
- **VPS Setup**: `scripts/vps-setup.sh` (automated VPS deployment)
- **File Upload**: `scripts/upload-files.sh` (deploy to VPS)
- **Admin Panel**: http://drawstep.de/admin (production) or http://localhost:3000/admin (local)

## Important Development Guidelines
- **NEVER attempt autonomous changes** - Always ask before making modifications
- **Ask first, code second** - Better to ask one time too many than too few
- **No independent problem-solving** - Always confirm approach with user before implementing
- **Constraint adherence** - When user sets constraints (e.g., "keine attribute verändert werden"), follow them exactly
- **Consultation over assumption** - If uncertain about any aspect, ask for clarification rather than assuming

## Current Issues
- **SSL Certificate**: Let's Encrypt certificate installation pending (manual setup required)
- **Welcome Window Bug**: Welcome window für Mulligan Trainer zeigt sich nur einmal, dann nie wieder - auch nach Browser-Neustart nicht. localStorage Flag wird permanent gesetzt und verhindert erneute Anzeige. Problem: Ctrl+Shift+R leert nur Cache, nicht localStorage. Verschiedene Lösungsansätze mit localStorage/sessionStorage noch nicht zufriedenstellend.

## Recently Resolved Issues
- **✅ RESOLVED - allCards.json Data Issues**: Successfully integrated Set 9 (Fabled) cards and fixed all data consistency problems:
  - Added 203 Set 9 cards from lorcast.com API with proper field mapping
  - Fixed inkable detection showing correct counts (12 uninkables for test deck)
  - Corrected field name inconsistencies (Name/name, Cost/cost, Inkable/inkwell)
  - Restored ink curve visualization functionality
  - Updated image mapping system for new cards

## Notes
- Tournament tracking will be handled by separate app, not this mulligan trainer
- Focus on training and practice features for the mulligan trainer