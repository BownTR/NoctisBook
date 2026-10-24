const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const PORT = process.env.PORT || 3000;
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

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Static file serving for GET requests
    if (req.method === 'GET') {
        let reqPath = req.url.split('?')[0];
        if (reqPath === '/') reqPath = '/index.html';

        const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
        let filePath = path.join(__dirname, safePath);

        const serveFile = (pathToSend) => {
            const ext = path.extname(pathToSend).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            fs.createReadStream(pathToSend).pipe(res);
        };

        fs.stat(filePath, (err, stats) => {
            if (!err && stats.isFile()) {
                serveFile(filePath);
            } else if (!path.extname(filePath)) {
                // Uzantısız istekler için .html dene (örn: /discover -> /discover.html)
                const htmlPath = filePath + '.html';
                fs.stat(htmlPath, (htmlErr, htmlStats) => {
                    if (!htmlErr && htmlStats.isFile()) {
                        serveFile(htmlPath);
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('404 Sayfa Bulunamadı');
                    }
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('404 Sayfa Bulunamadı');
            }
        });
        return;
    }

    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
        let parsedBody = {};
        if (body) {
            try {
                parsedBody = JSON.parse(body);
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, message: 'Geçersiz veri formatı.' }));
            }
        }

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
                if (Array.isArray(chapters)) {
                    chapters.forEach(chap => {
                        stmt.run(user_id, chap.title, chap.content);
                    });
                }
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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`-----------------------------------------`);
    console.log(`Noctis Kitap Dünyası Başlatıldı!`);
    console.log(`URL: http://0.0.0.0:${PORT}`);
    console.log(`Veritabanı (SQLite): ${DB_PATH}`);
    console.log(`-----------------------------------------`);
});
