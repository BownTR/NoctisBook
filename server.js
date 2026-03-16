const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const PORT = 3000;
const DB_PATH = path.join(__dirname, 'database.sqlite');

// Initialize Database
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
    // Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT
    )`);

    // Chapters/Books Table
    db.run(`CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        content TEXT,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
});

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        const parsedBody = body ? JSON.parse(body) : {};

        // 1. REGISTER
        if (req.method === 'POST' && req.url === '/register') {
            const { name, email, password } = parsedBody;
            db.run(`INSERT INTO users (name, email, password) VALUES (?, ?, ?)`, [name, email, password], function(err) {
                if (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, message: 'Bu e-posta zaten kullanımda.' }));
                }
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, user: { id: this.lastID, name, email } }));
            });
        }

        // 2. LOGIN
        else if (req.method === 'POST' && req.url === '/login') {
            const { email, password } = parsedBody;
            db.get(`SELECT id, name, email FROM users WHERE email = ? AND password = ?`, [email, password], (err, user) => {
                if (err || !user) {
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ success: false, message: 'Hatalı e-posta veya şifre.' }));
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, user }));
            });
        }

        // 3. GET CHAPTERS
        else if (req.method === 'POST' && req.url === '/get-chapters') {
            const { user_id } = parsedBody;
            db.all(`SELECT * FROM chapters WHERE user_id = ? ORDER BY id ASC`, [user_id], (err, rows) => {
                if (err) {
                    res.writeHead(500);
                    return res.end();
                }
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, chapters: rows }));
            });
        }

        // 4. SAVE CHAPTERS (Sync all)
        else if (req.method === 'POST' && req.url === '/save-chapters') {
            const { user_id, chapters } = parsedBody;
            
            // Simplified: Delete and re-insert for the user (Atomic enough for this scale)
            db.serialize(() => {
                db.run(`DELETE FROM chapters WHERE user_id = ?`, [user_id]);
                const stmt = db.prepare(`INSERT INTO chapters (user_id, title, content) VALUES (?, ?, ?)`);
                chapters.forEach(chap => {
                    stmt.run(user_id, chap.title, chap.content);
                });
                stmt.finalize();
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            });
        }

        else {
            res.writeHead(404);
            res.end();
        }
    });
});

server.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`Gerçek Veri Tabanı Aktif! (SQLite)`);
    console.log(`URL: http://localhost:${PORT}`);
    console.log(`Dosya: ${DB_PATH}`);
    console.log(`-----------------------------------------`);
});
