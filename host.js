const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const initSqlJs = require("sql.js");

const app = express();
const port = process.env.PORT || 3000;

// Security: Use environment variables for sensitive configuration
const sessionSecret = process.env.SESSION_SECRET || "elite-secret-key-2026-ultra";
const isProduction = process.env.NODE_ENV === 'production';

let db = null;

// Initialize sql.js database
async function initDatabase() {
    const SQL = await initSqlJs();
    const dbPath = path.join(__dirname, "website.sqlite");

    let filebuffer;
    try {
        filebuffer = fs.readFileSync(dbPath);
    } catch (err) {
        filebuffer = null;
    }

    db = new SQL.Database(filebuffer);

    // Initialize Tables
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'Member'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS players (
        username_key TEXT PRIMARY KEY,
        name TEXT,
        player_id TEXT,
        clan TEXT,
        theme_color TEXT,
        total_points INTEGER,
        current_points INTEGER,
        saved_points INTEGER,
        review_memorization TEXT,
        improvements TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS clans (
        name TEXT PRIMARY KEY,
        monthly_improvement TEXT
    )`);

    saveDatabase();
    console.log("Connected to the SQLite database.");
}

// Save database to file
function saveDatabase() {
    if (!db) return;
    const data = db.export();
    const buffer = Buffer.from(data);
    const dbPath = path.join(__dirname, "website.sqlite");
    fs.writeFileSync(dbPath, buffer);
}

// Create index.html if it doesn't exist
const ensureIndexHtml = () => {
    const indexPath = path.join(__dirname, "index.html");
    try {
        fs.accessSync(indexPath, fs.constants.F_OK);
    } catch (err) {
        console.error("index.html not found:", err);
    }
};

ensureIndexHtml();

app.use(express.json({ limit: '10mb', strict: false }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'eliteSessionId',
    cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict',
        path: '/'
    },
    rolling: true
}));

function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.status(401).json({
        error: "Not authenticated",
        code: "AUTH_REQUIRED"
    });
}

// Input validation functions
function validateUsername(username) {
    if (!username || typeof username !== 'string') {
        return { valid: false, error: "Username is required" };
    }
    if (username.length < 3 || username.length > 30) {
        return { valid: false, error: "Username must be 3-30 characters" };
    }
    const sanitized = username.replace(/[<>'"\];(){}]/g, '');
    if (sanitized !== username) {
        return { valid: false, error: "Invalid username format" };
    }
    return { valid: true, value: username };
}

function validatePassword(password) {
    if (!password || typeof password !== 'string') {
        return { valid: false, error: "Password is required" };
    }
    if (password.length < 8) {
        return { valid: false, error: "Password must be at least 8 characters" };
    }
    return { valid: true };
}

function validateStats(stats) {
    if (!stats || typeof stats !== 'object') {
        return { valid: false, error: "Stats data is required" };
    }

    const allowedFields = ['totalPoints', 'currentPoints', 'savedPoints', 'reviewMemorization'];
    for (const [key, value] of Object.entries(stats)) {
        if (!allowedFields.includes(key)) {
            return { valid: false, error: `Invalid stats field: ${key}` };
        }

        if (key.includes('Points') && value !== undefined) {
            if (typeof value !== 'number' || value < 0 || value > Number.MAX_SAFE_INTEGER) {
                return { valid: false, error: `Invalid value for ${key}` };
            }
        }

        if (key === 'reviewMemorization' && value !== undefined) {
            if (typeof value !== 'string' || !/^[0-9]+%$/.test(value)) {
                return { valid: false, error: `Invalid format for ${key}` };
            }
        }
    }

    return { valid: true };
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/api/signup", async (req, res) => {
    const { username, password } = req.body;

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        return res.status(400).json({ error: usernameValidation.error, code: "INVALID_USERNAME" });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.error, code: "INVALID_PASSWORD" });
    }

    const sanitizedUsername = usernameValidation.value;

    const forbidden = ['admin', 'root', 'system'];
    if (forbidden.includes(sanitizedUsername.toLowerCase())) {
        return res.status(400).json({ error: "Username not allowed", code: "FORBIDDEN_USERNAME" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 12);

        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [sanitizedUsername, hashedPassword]);

        const userKey = sanitizedUsername.toLowerCase().split(' ')[0];
        const playerId = `${Math.random().toString(36).substr(2, 3)}-${sanitizedUsername.toUpperCase().substr(0, 2)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

        db.run(`
            INSERT INTO players (username_key, name, player_id, clan, theme_color, total_points, current_points, saved_points, review_memorization, improvements)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            userKey,
            sanitizedUsername,
            playerId,
            'Solo Player',
            '#3b82f6',
            0,
            0,
            0,
            '0%',
            JSON.stringify({ total: '0%', current: '0%', saved: '0%', mem: '0%' })
        ]);

        saveDatabase();
        res.json({ success: true, userId: 1, code: "USER_CREATED" });
    } catch (err) {
        console.error("Database error on signup:", err);
        if (err.message.includes("UNIQUE constraint")) {
            return res.status(400).json({ error: "Username already taken", code: "DUPLICATE_USERNAME" });
        }
        res.status(500).json({ error: "Internal server error", code: "DB_ERROR" });
    }
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Credentials required", code: "CREDENTIALS_REQUIRED" });
    }

    try {
        const stmt = db.prepare(`SELECT * FROM users WHERE username = ?`);
        stmt.bind([username]);

        if (!stmt.step()) {
            return res.status(401).json({ error: "Invalid credentials", code: "LOGIN_FAILED" });
        }

        const user = stmt.getAsObject();
        stmt.free();

        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.regenerate((err) => {
                if (err) {
                    console.error("Session regeneration error:", err);
                    return res.status(500).json({ error: "Internal server error", code: "SERVER_ERROR" });
                }
                req.session.user = { id: user.id, username: user.username, role: user.role };
                res.json({ success: true, username: user.username, role: user.role, code: "LOGIN_SUCCESS" });
            });
        } else {
            res.status(401).json({ error: "Invalid credentials", code: "LOGIN_FAILED" });
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error", code: "SERVER_ERROR" });
    }
});

app.get("/api/me", isAuthenticated, (req, res) => {
    res.json(req.session.user);
});

app.post("/api/logout", (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Serve players data from SQLite database
app.get("/players.json", (req, res) => {
    try {
        const stmt = db.prepare(`SELECT * FROM players`);
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();

        const clanStmt = db.prepare(`SELECT * FROM clans`);
        const clanRows = [];
        while (clanStmt.step()) {
            clanRows.push(clanStmt.getAsObject());
        }
        clanStmt.free();

        const result = {};

        rows.forEach(r => {
            result[r.username_key] = {
                name: r.name,
                id: r.player_id,
                clan: r.clan,
                themeColor: r.theme_color,
                totalPoints: r.total_points,
                currentPoints: r.current_points,
                savedPoints: r.saved_points,
                reviewMemorization: r.review_memorization,
                improvements: (() => {
                    try {
                        return JSON.parse(r.improvements || '{}');
                    } catch (e) {
                        return {};
                    }
                })()
            };
        });

        const clans = {};
        clanRows.forEach(c => {
            const members = rows
                .filter(r => r.clan === c.name)
                .map(r => ({
                    name: r.name,
                    role: (r.name === "Sam Winchester" || r.name === "Castiel") ? "Leader" : "Member",
                    points: r.total_points
                }));

            clans[c.name] = {
                monthlyImprovement: c.monthly_improvement,
                members: members
            };
        });

        result.clans = clans;
        res.json(result);
    } catch (err) {
        console.error("Database error fetching players:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// Update points API for the Clan Leader
app.post("/api/update-stats", isAuthenticated, (req, res) => {
    if (req.session.user.role !== 'Leader') {
        return res.status(403).json({
            error: "Access denied. Only the Clan Leader can update stats.",
            code: "INSUFFICIENT_PERMISSIONS"
        });
    }

    const { username, stats } = req.body;

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        return res.status(400).json({ error: usernameValidation.error, code: "INVALID_USERNAME" });
    }

    const statsValidation = validateStats(stats);
    if (!statsValidation.valid) {
        return res.status(400).json({ error: statsValidation.error, code: "INVALID_STATS" });
    }

    try {
        const sanitizedUsername = usernameValidation.value;
        const userKey = sanitizedUsername.toLowerCase().split(' ')[0];

        const getStmt = db.prepare(`SELECT * FROM players WHERE username_key = ?`);
        getStmt.bind([userKey]);

        if (!getStmt.step()) {
            getStmt.free();
            return res.status(404).json({ error: "Player not found in records", code: "PLAYER_NOT_FOUND" });
        }

        const player = getStmt.getAsObject();
        getStmt.free();

        const newTotal = stats.totalPoints !== undefined ? stats.totalPoints : player.total_points;
        const newCurrent = stats.currentPoints !== undefined ? stats.currentPoints : player.current_points;
        const newSaved = stats.savedPoints !== undefined ? stats.savedPoints : player.saved_points;
        const newReview = stats.reviewMemorization !== undefined ? stats.reviewMemorization : player.review_memorization;

        db.run(`
            UPDATE players
            SET total_points = ?, current_points = ?, saved_points = ?, review_memorization = ?
            WHERE username_key = ?
        `, [newTotal, newCurrent, newSaved, newReview, userKey]);

        saveDatabase();
        res.json({ success: true, message: "Stats updated successfully", code: "STATS_UPDATED" });
    } catch (err) {
        console.error("Database update error:", err);
        res.status(500).json({ error: "Could not save data", code: "DB_WRITE_ERROR" });
    }
});

// Start server after database is initialized
initDatabase().then(() => {
    const server = app.listen(port, "0.0.0.0", () => {
        console.log(`Elite Secure Server active at http://localhost:${port}`);
        if (isProduction) {
            console.log("Running in production mode with enhanced security");
        }
    });

    // Keep the server alive with periodic output for dev tools
    setInterval(() => {
        process.stdout.write('.');
    }, 5000);
}).catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
});
