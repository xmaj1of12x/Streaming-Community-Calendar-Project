const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'SCCP0100', '.env') });

const express = require('express');
const fs = require('fs');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 55564;
const HOST = '127.0.0.1';
const DATA_FILE = path.join(__dirname, 'calendar-data.json');
const STATIC_DIR = path.join(__dirname, 'SCCP0100');
const PASSWORD = process.env.EDITOR_PASSWORD || 'changeme';

app.use(express.json());
app.use(cookieParser());

// 1. Public Routes (No authentication required)
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'login.html'));
});

app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === PASSWORD) {
        res.cookie('auth_token', PASSWORD, { httpOnly: true, maxAge: 86400000 }); // 1 day
        return res.json({ success: true });
    }
    res.status(401).json({ error: "Invalid password" });
});

// 2. Auth Middleware
const requireAuth = (req, res, next) => {
    const cookieToken = req.cookies.auth_token;
    if (cookieToken === PASSWORD) {
        return next();
    }
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(403).json({ error: "Unauthorized" });
    }
    return res.redirect('/login.html');
};

// 3. Protected Page Routes
app.get('/', requireAuth, (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

app.get('/index.html', requireAuth, (req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// Serve any remaining static assets securely
app.use(express.static(STATIC_DIR));

// 4. Protected Calendar API Endpoints
app.get('/api/calendar', requireAuth, (req, res) => {
    if (!fs.existsSync(DATA_FILE)) return res.json([]);
    res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8') || '[]'));
});

app.post('/api/calendar', requireAuth, (req, res) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
});

app.listen(PORT, HOST, () => console.log(`Secure calendar editor running on http://${HOST}:${PORT}`));