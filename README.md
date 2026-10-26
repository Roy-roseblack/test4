# ULTRA ELITE - Pro Player Stats Dashboard

A secure, elite player statistics dashboard with authentication, clan management, and real-time stats tracking.

## Features

- **User Authentication**: Secure login/signup with bcrypt password hashing
- **Player Dashboard**: Display personalized stats including total points, current points, saved points, and review memorization
- **Clan Management**: View clan members and clan growth statistics
- **Command Center**: Clan leaders can view team performance analytics and edit member stats
- **Responsive Design**: Mobile-friendly interface with beautiful gradient UI
- **Session Management**: Secure session handling with Express sessions

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: SQLite3
- **Frontend**: Vanilla JavaScript with CSS animations
- **Security**: bcryptjs for password hashing, session-based authentication

## Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/website.git
cd website
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
node host.js
```

The server will run on `http://localhost:3000`

## Usage

### Default Accounts (for testing)
- **Username**: sam | **Password**: password123 (Leader)
- **Username**: testdean | **Password**: password123 (Member)
- **Username**: testuser | **Password**: password123 (Member)

Or create a new account by signing up.

### Features

1. **Login**: Sign in with your credentials
2. **Dashboard**: View your personal player stats
3. **Clan Info**: Click on clan name to see clan members
4. **Command Center**: (Leaders only) Click "Open Command Center" to manage team stats
5. **Edit Stats**: (Leaders only) Use EDIT button to update member statistics

## Project Structure

```
website/
├── index.html              # Main HTML file
├── host.js                # Express server configuration
├── package.json           # Project dependencies
├── public/
│   ├── js/
│   │   └── app.js        # Frontend JavaScript
│   └── css/
│       └── style.css     # Stylesheet with animations
└── website.sqlite        # SQLite database
```

## API Endpoints

- `POST /api/signup` - Create new user account
- `POST /api/login` - User login
- `GET /api/me` - Get current user info (requires auth)
- `POST /api/logout` - User logout
- `GET /players.json` - Get all players and clans data
- `POST /api/update-stats` - Update player stats (Leaders only)

## Bug Fixes

### Fixed Issues:
1. **Command Center crash** - Added validation for empty clan members
2. **Stats update validation** - Auto-append `%` to memorization format
3. **Page layout shift** - Fixed horizontal scroll on refresh with `overflow-y: scroll`
4. **Port compatibility** - Changed from port 5000 to 3000 (Windows reserved port)

## Security Features

- Password hashing with bcryptjs (12 rounds)
- Session-based authentication with secure cookies
- CSRF protection with SameSite cookie policy
- Input validation and sanitization
- SQL injection prevention with parameterized queries
- XSS protection with httpOnly cookies
- HTTPS-ready configuration for production

## License

ISC

## Author

Roy

---

For more information or to report issues, please visit the GitHub repository.
