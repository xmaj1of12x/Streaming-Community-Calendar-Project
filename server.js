require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 55565;
const DATA_FILE = path.join(__dirname, 'calendar_events.json');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// =========================================================================
// PLATFORM CHANNEL POLLING ARRAYS (NULL BASELINE)
// Replace sample entries below with your own community's handles / IDs.
// =========================================================================

const KICK_CHANNELS = [
    "sample_kick_creator1", "sample_kick_creator2"
];

const TWITCH_CHANNELS = [
    "sample_twitch_creator1", "sample_twitch_creator2"
];

const YOUTUBE_CHANNELS = {
    "Sample Channel 1": { "id": "UCXXXXXXXXXXXXXXXXXXXXXX" },
    "Sample Channel 2": { "id": "UCYYYYYYYYYYYYYYYYYYYYYY" }
};

let liveStatus = {
    kick: { online: [], totalTracked: KICK_CHANNELS.length },
    twitch: { online: [], totalTracked: TWITCH_CHANNELS.length },
    youtube: { new_uploads: [], totalTracked: Object.keys(YOUTUBE_CHANNELS).length }
};

let twitchAccessToken = null;

function loadEvents() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialStructure = { events: [] };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialStructure, null, 2), 'utf8');
        return initialStructure;
    }
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
            return { events: parsed };
        }
        return parsed;
    } catch (e) {
        return { events: [] };
    }
}

function saveEvents(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function getTwitchAccessToken() {
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) return null;
    try {
        const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`, {
            method: 'POST'
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.access_token;
    } catch (err) {
        return null;
    }
}

async function scanKick() {
    console.log(`[KICK SCAN] Querying Kick API endpoints...`);
    const online = [];
    for (const channel of KICK_CHANNELS) {
        try {
            const res = await fetch(`https://kick.com/api/v2/channels/${channel}`, {
                headers: { 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.livestream) {
                    online.push(channel);
                }
            }
        } catch (err) {
            // Skip on connection drop
        }
    }
    liveStatus.kick.online = online;
    console.log(`[KICK COMPLETE] ${online.length} channels live.`);
}

async function scanTwitch() {
    if (!twitchAccessToken) {
        twitchAccessToken = await getTwitchAccessToken();
    }
    if (!twitchAccessToken) return;

    console.log(`[TWITCH SCAN] Querying Twitch Helix API...`);
    const online = [];
    
    for (let i = 0; i < TWITCH_CHANNELS.length; i += 100) {
        const chunk = TWITCH_CHANNELS.slice(i, i + 100);
        const params = chunk.map(c => `user_login=${encodeURIComponent(c)}`).join('&');
        
        try {
            const res = await fetch(`https://api.twitch.tv/helix/streams?${params}`, {
                headers: {
                    'Client-ID': TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${twitchAccessToken}`
                }
            });
            
            if (res.status === 401) {
                twitchAccessToken = await getTwitchAccessToken();
                continue;
            }
            
            if (res.ok) {
                const data = await res.json();
                if (data.data) {
                    data.data.forEach(stream => {
                        online.push(stream.user_name);
                    });
                }
            }
        } catch (err) {
            // Skip chunk failure
        }
    }
    
    liveStatus.twitch.online = online;
    console.log(`[TWITCH COMPLETE] ${online.length} channels live.`);
}

async function scanYouTubeUploads() {
    if (!YOUTUBE_API_KEY) return;
    console.log(`[YOUTUBE SCAN] Querying YouTube Data API...`);
    const newUploads = [];
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    for (const [name, info] of Object.entries(YOUTUBE_CHANNELS)) {
        try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${info.id}&part=snippet&order=date&maxResults=1&publishedAfter=${oneDayAgo}`);
            if (res.ok) {
                const data = await res.json();
                if (data.items && data.items.length > 0) {
                    newUploads.push(name);
                }
            }
        } catch (err) {
            // Skip upload failure
        }
    }

    liveStatus.youtube.new_uploads = newUploads;
    console.log(`[YOUTUBE COMPLETE] ${newUploads.length} recent uploads found.`);
}

scanKick();
scanTwitch();
scanYouTubeUploads();

setInterval(scanKick, 15 * 60 * 1000);
setInterval(scanTwitch, 10 * 60 * 1000);
setInterval(scanYouTubeUploads, 30 * 60 * 1000);

const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'GET' && pathname === '/api/events') {
        const dataStore = loadEvents();
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(dataStore.events));
        return;
    }

    if (req.method === 'GET' && pathname === '/api/status/all') {
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        res.end(JSON.stringify(liveStatus));
        return;
    }

    if (req.method === 'POST' && pathname === '/api/events') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const newEvent = JSON.parse(body);
                const dataStore = loadEvents();
                dataStore.events.push(newEvent);
                saveEvents(dataStore);
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                res.end(JSON.stringify({ status: "success", event: newEvent }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Invalid JSON payload" }));
            }
        });
        return;
    }

    let filePath = path.join(__dirname, pathname === '/' ? 'calendar_index.html' : pathname);
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Endpoint or file not found" }));
        } else {
            let ext = path.extname(filePath);
            let contentType = 'text/html';
            if (ext === '.js') contentType = 'text/javascript';
            if (ext === '.css') contentType = 'text/css';
            if (ext === '.json') contentType = 'application/json';

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`[COMMUNITY CALENDAR SERVER] Active on port ${PORT}`);
});