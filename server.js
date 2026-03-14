const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const EXPORT_DIR = path.join(__dirname, 'exports');

// Create exports directory if it doesn't exist
if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR);
}

const server = http.createServer((req, res) => {
    // Basic CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/save') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const { title, content } = data;

                // Clean title for filename
                const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const filePath = path.join(EXPORT_DIR, `${safeTitle}.txt`);

                // Convert HTML content to plain text for "Wordpad" style
                const plainText = content
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<p>/gi, '')
                    .replace(/<\/p>/gi, '\n')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/<[^>]*>/g, ''); // Strip remaining tags

                fs.writeFileSync(filePath, plainText, 'utf8');

                console.log(`[${new Date().toLocaleTimeString()}] Kaydedildi: ${safeTitle}.txt`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, path: filePath }));
            } catch (err) {
                console.error('Kayıt Hatası:', err);
                res.writeHead(500);
                res.end('Server Error');
            }
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`-----------------------------------------`);
    console.log(`Kitap Kayıt Sunucusu Başlatıldı!`);
    console.log(`Port: ${PORT}`);
    console.log(`Dosyaların kaydedileceği yer: ${EXPORT_DIR}`);
    console.log(`-----------------------------------------`);
});
