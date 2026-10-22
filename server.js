require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 55565;
const DATA_FILE = path.join(__dirname, 'calendar_events.json');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

const KICK_CHANNELS = [
    "xidaniel", "xmrstrippyx", "xqc", "xtimsanityx", "youmadpapi", "zbomb", 
    "2gunztommy", "aisea9suwoop", "akesgaming", "alexc199", "amouranth", 
    "asmongold247", "badchair", "bamfgaming", "bbjess", "bigcrumbz", "bigshady", 
    "blondiee", "bluegurl99", "corneliusthecat", "crowegamingg", "d0peb0i", 
    "derangeddelusion", "destrox88x", "durdeeburd", "dutchmasterlive", "dxd_xenoz", 
    "eddie", "erectdictator", "eslcs", "exicutionx", "eyenebula", "fightingsloth", 
    "flaminhotmitts", "fozzyb3ar", "geminithelegend", "gingerbradman", "gummyisgaming", 
    "heatherlynnoh", "hitta17", "hoofy712", "hyyjoe", "iinsanexp", "itssscat", 
    "kai2blessed", "kaptainkoolwhip", "kingscorpius", "kmomma5", "lazeepanda", 
    "leaderofkilljoys", "lisibrm", "mattimoshi", "maxbosm", "mercilessgsg", 
    "miishyink", "mrnltro", "mrukkickofficial", "mssavageaf", "myreshatv", 
    "natorious-eli", "nextleveljj", "nicknaks94", "notyurmum", "novacourt", 
    "novad", "nullax2", "nulltagafb", "obelix89", "oceanrgatsby", "peachypeytn", 
    "pgfworld", "psilencer", "psybangas", "pt_yt", "queen_laqueefah", "queenmanda", 
    "rampagejackson", "razorredd", "recklessvely", "robbinhudz", "sadi", "sagibearius", 
    "saralunara", "savageleegaming", "shadyhd", "shortypie", "sir_savage", "soultravels", 
    "stormbreaker", "sweeterin", "tahnepunaniii", "tazo", "texas-madman", 
    "the_french_invasion_69", "theburntpeanut", "thecanniboss", "thehighwayman84", 
    "theicequeen420", "themillerchild", "thetypicalscum", "tifferbelle", "trushadow", 
    "uhmaayyze", "virulentvonwaif", "whytryblaze", "xclocky"
];

const TWITCH_CHANNELS = [
    "bebahan", "emiru247", "quarterjade247", "bonnieoffline", "recklessvely",
    "ericanagashima", "jadici", "badassmommy", "ragerredhead", "quarterjade",
    "blondiettv", "meghan_yeah", "andymilonakis", "glutenfree_waifu",
    "tinakitten", "julia_tv", "devonjenelle", "queenmanda", "kozykara",
    "pokimane", "tsjustfreshh", "uberfluff94", "whizzyll",
    "theshadyhd", "derpdream", "psybangas", "deathstalker254",
    "ayy_tonyromero", "primevideo", "kittyowner1", "justkanna_", "blaqharleyque",
    "oxxyog", "xxyikes", "lovelylo", "qtcinderella", "skaiday",
    "aflowwww", "ratedrko", "maefireflyyy", "alexdelgado", "montoyatwinz",
    "charcolised", "cassiabree", "yungbuffalosauce", "summit1g", "sarina",
    "skooty_puff_jr", "shortey1303", "literallycheeks", "peytonmorete", "suburbbaby",
    "deathlyill", "ashdracc", "nahyunworld", "skyhook",
    "jesswyatt", "just_dendo", "caitoplaysgames", "mira", "fawn",
    "jinnytty", "cambercat", "dankpizzas", "sxyseyvn", "chrissymenzies__",
    "softlyrubi", "aphroditeshaz", "realynottony", "feliciaday", "moman24h",
    "chloe__247", "cottontailva247", "theburntpeanut_247", "jokerjessie", "lacyoffline_",
    "qoqsik247", "thesoulsfix", "starlightslumber", "trashtastepodcast", "247nats",
    "timthetatmanvods", "chocotaco247", "sery_bot", "griffybit247", "starsmitten247",
    "burkeblack247", "clovervods", "thestussmeister", "badgesnews", "rexsi",
    "questionmarkkkkk_", "tokushoutsu", "missmikkaa247", "nukadave247", "layna247",
    "bonnieoffline", "triplax24"
];

const YOUTUBE_CHANNELS = {
    "7th Sleeper": { "id": "UCQBeerst3nqUmMZ2frSEMXQ" },
    "aCookieGod": { "id": "UCIVSqoHCUN1XdEpiVItxfoQ" },
    "AileenSenpai": { "id": "UCOBoD6bpIql9XopwHXVEDTA" },
    "Beepss": { "id": "UCS7c1m3PLYsEeE3tYjKjxfg" },
    "Big Shady": { "id": "UC0CArP-_qKvNqlGB2ruE02Q" },
    "BigBoiPnut": { "id": "UC0V2UyI7FoPZyi1pCPWTESQ" },
    "Bix": { "id": "UCpKWW_JfQ-j56n7QS0zJpPw" },
    "BlaqHarleyQue": { "id": "UC3Sam8cRDDvcoRzFZmVSXkg" },
    "Bonnie": { "id": "UCSIH7vz1dEPPvZCqZRp0jwQ" },
    "BurritoBoi": { "id": "UCc5B6TiXk5sNrEssbSIr-8A" },
    "CherryBlossomShinobi": { "id": "UCM50gcq28BXX4JuIc1m-3Og" },
    "Clocky": { "id": "UC-QOCDOM_B4-KnorsE-Gwgw" },
    "ClownPierce": { "id": "UCs3bpV2sr9P9csJVAyogArQ" },
    "CroweGamingg": { "id": "UCW7JS7iONQh5WB8HTjM600Q" },
    "Cuzb0t": { "id": "UCt093rFnHzxQYwQIcl_1VAw" },
    "DaliNova": { "id": "UC9UNDXVnzojNmRqRshtZcUg" },
    "Destro": { "id": "UCs39Si5Rz-CUc0Ldxu_gLIw" },
    "Doc Squiffy": { "id": "UCFOStcorp34JSwYTaTZB1oQ" },
    "Drxgo": { "id": "UCeDgbMAfCczl2nlTcwBCC9g" },
    "Eggchan": { "id": "UCUL6go4PVW39OmfBZRNJbYg" },
    "EmberShadow": { "id": "UCL20_M53sB7dDSXF94W77Rg" },
    "ErectDictator": { "id": "UCQ3lX93cWmkRBlPSz7D2U8w" },
    "FightingSlothHQ": { "id": "UC5wisvHtw_wdsTzVFYoK6fA" },
    "FitMC": { "id": "UCHZ986wm_sJT6wntdDTIIcw" },
    "FNATIC": { "id": "UCxo56gzJQ_fhb6svPqTSewg" },
    "galaxysystem_games": { "id": "UCEx6fsG89ZrnscabEy7zqlg" },
    "GawdDAMM_it": { "id": "UCEWduJXk9z1V1lnnuZND_cA" },
    "GeminITheLegend": { "id": "UCP-7k748K3Wggo__mlmsuqA" },
    "GingerBradDad": { "id": "UC5yH8IWwUW9oS4IB5k4rcUQ" },
    "Globalhodgy": { "id": "UCS0DhPK1Ce299LbQ8vAQlGw" },
    "GooNz": { "id": "UCg2kbBwM9PmVKkRZGMyaNLQ" },
    "GummyIsGaming": { "id": "UC-7zkFViF9-x8hh2Jf9EXGA" },
    "Hitta17": { "id": "UCLhXsUvD_FiS1kWHDmg-rTg" },
    "Imbrandonfarris": { "id": "UC3v6sjWuPxtW36jQ-if4OuA" },
    "ItsJustFreshh": { "id": "UCtzBJAL9tleZBjv8gpygIIw" },
    "Jakey": { "id": "UCeJPJkWH8qwagi00hi47dyg" },
    "JUDO RED": { "id": "UCWh7vIJMkswtKOxCEsBTTxQ" },
    "JumperWho": { "id": "UCGF5H53_h3Y6IGpANbDEh6w" },
    "JunglePanther": { "id": "UC3Ilbt7V8pQISsOCVy2Ny8g" },
    "KaptainKoolWhip": { "id": "UC3g3MFsFjm0VppV1Nh1F-RA" },
    "King Scorpius": { "id": "UCEvKxQ9AbMcTlNZekG1i_Ug" },
    "Kira_Lovey": { "id": "UC7UyWg9uvWJr4NlZWJPIybQ" },
    "Lainey Maree": { "id": "UCVSVSLTqB4OCIx4GVAHmzKA" },
    "Laurenkimripley": { "id": "UCpJSbFNxRgbWcruXdX62Rng" },
    "LazeePanda": { "id": "UCn7w-YGj9SSyE62ZsnbudLw" },
    "Leader of Killjoys": { "id": "UC9F8z-7ARJmpwGDG2dmRN6g" },
    "LegionzGaming": { "id": "UCX6NsaPt4a5Q446vax5P-Ig" },
    "Lisibrm": { "id": "UCrtW3Z8XKqzfkMVXIyntMOw" },
    "Liz": { "id": "UCerbSh1F2161eshPM_13SvA" },
    "LolaBunz": { "id": "UCI5Xdp65wkVFxr_53YhWzUg" },
    "LuxRaiyne": { "id": "UCVr4MKw5BWqElvIvVYoOwYw" },
    "Lyss": { "id": "UCKg-LM81FJ7-C9Z76GwlUjQ" },
    "MaxBosm": { "id": "UCvsVNl5-ia1B9t1M6DOiXTA" },
    "MEGAMOVIELORD": { "id": "UCejaKqQTpcKZCQ0gqn0Ezmw" },
    "merciless": { "id": "UCuLg3vPhw3zWTguiRfJRCSQ" },
    "MinuteTech": { "id": "UCnG5cpbos9yQt9Zh8Wz1nYg" },
    "MrBeast": { "id": "UCX6OQ3DkcsbYNE6H8uQQuVA" },
    "MrBeast Gaming": { "id": "UCIPPMRA040LQr5QPyJEbmXA" },
    "mrnigelng": { "id": "UCVjlpEjEY9GpksqbEesJnNA" },
    "Naaackers": { "id": "UC6eMM0ncyMThFXxqJw67pdQ" },
    "Natorious_Eli": { "id": "UC_FA5ZhVZ-ixcHH9w9kYbpg" },
    "NextLevel JJ": { "id": "UC3ce-DoVf4dI4yS00UmWKiA" },
    "NovaCourt": { "id": "UCk7aEhCJSsSL3Htx5b_7Znw" },
    "Novad The Goat": { "id": "UCL8mLNFOlANUfjN-c3eFHvQ" },
    "NullaX2": { "id": "UC0ln2R2S-MZpq4XbEQ2o8tQ" },
    "PeachyPeytn": { "id": "UCrRJPsiz21cZCupxtSYQkDw" },
    "Pepsilk": { "id": "UC0YQ76D7FmO2q-T7QAYD8bA" },
    "Person4x": { "id": "UCQS3q6HDIrTF9cnK3CjRCCQ" },
    "Ping": { "id": "UCqDbbKM_yE8NR2fk3CFUi2g" },
    "Pokimane": { "id": "UChXKjLEzAB1K7EZQey7Fm1Q" },
    "Psilencer": { "id": "UCpsKXy8Z43uZtqfn-oe3emA" },
    "PT_YT": { "id": "UCvd-oc3J_oiO_ilR5VAvcgA" },
    "QuarterJade": { "id": "UC_wSuaxwUYsJOBZDWwHIQZg" },
    "Queen Laqueefah": { "id": "UCVq_Yndy9-vP-TvBT7WWcLA" },
    "QueenManda": { "id": "UCHKfdYF6h34SF78RuqijoTg" },
    "RagerRedhead": { "id": "UCpkAsWXxGcq2W6D7WypVSwA" },
    "Razor Redd": { "id": "UCmUelGV6RD05JzREfLYWihg" },
    "RobbinHudz": { "id": "UCjEbI7aetBxIUtAYLDmIJpQ" },
    "SarahxxBeara": { "id": "UCNHBrjoVO95uRilT2bD4wEA" },
    "ShadyHD": { "id": "UCYzykgkkhTPt6HLdfhOBQ7w" },
    "SHORTYPlE": { "id": "UCQnUtDoaTpmxcoE4Znp50aw" },
    "Steven He": { "id": "UCP0_k4INXrwPS6HhIyYqsTg" },
    "StormBreaker": { "id": "UCWC7TL2kZks3ybnXwsu1KhA" },
    "SweeetTails": { "id": "UCC1U807bfxKSjcJJGBv89VQ" },
    "TAZO": { "id": "UCFjo9dMhM3i_J1pGm93rrVw" },
    "TechDoctorUK": { "id": "UCIyy1sSlrgUYKcEqvL4smjQ" },
    "The Dadbod Veteran": { "id": "UC_0pVwZdzjVIUcaavNZKmiA" },
    "TheBurntPeanut": { "id": "UCMNEVbszv8ZyvSXoTn3yhpQ" },
    "TheTypicalScum": { "id": "UCk-jQm53kjgAHU8oj5hhC3Q" },
    "TRUEgotcha": { "id": "UCGi3itLUwrrxCE4AI8p0ysQ" },
    "TruShadow": { "id": "UCwKytsjEf-Gt1kxKCTn4eww" },
    "UberFluff": { "id": "UCu2OdNRmvbcirwY_QavE_vA" },
    "Uhmaayyze": { "id": "UClSkTufgTBp5-lsTwqZEfpw" },
    "VirulentVonWaif": { "id": "UCm9gODoleTiEJsp0BJKnk5w" },
    "Weduh": { "id": "UCaR4U4C6rhfRMoB7xNNLiXA" },
    "WillowLeef Gaming": { "id": "UCZdgugwWWjzsSqUxTCn8Byg" },
    "Wuki": { "id": "UCTv611dn5xK-azjBaWh9zbg" },
    "XiaLand": { "id": "UCrkw8eZ0dJFwXKBjYwVccTw" },
    "xiDaniel": { "id": "UCRzFTMvm-jtpOzWTStN3uXA" },
    "xMrsTrippyx": { "id": "UCNvS91eCbcVLKpyZiRc9QIw" },
    "xTimsanityx": { "id": "UCB795ur6YlN-NdY-ZiAaCXg" },
    "You Should Know Podcast": { "id": "UCmMsCFzAufSYef6tA8h1hzQ" },
    "Youmadpapi": { "id": "UCdZ6s8sc41tgZgw2ItRg" },
    "ZBOMBCLIPS": { "id": "UC_nIdHGH6QYp8hET-R7UoTQ" }
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
    console.log(`[AUTHENTICATED SERVER WITH KICK] Active on port ${PORT}`);
});