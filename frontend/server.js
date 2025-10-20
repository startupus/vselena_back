const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME типы
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Обработка OPTIONS запросов
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    let filePath = '.' + req.url;
    console.log('Request URL:', req.url);
    console.log('File path:', filePath);
    
    // Специальная обработка для reset-password.html
    if (filePath.startsWith('./reset-password.html')) {
        console.log('Handling reset-password.html');
        filePath = './reset-password.html';
    }
    // Если это корневой путь или путь без расширения, обслуживаем index.html (SPA)
    else if (filePath === './' || !path.extname(filePath)) {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Если файл не найден, но это не статический ресурс, обслуживаем index.html (SPA)
                if (!extname || extname === '.html') {
                    fs.readFile('./index.html', (spaError, spaContent) => {
                        if (spaError) {
                            res.writeHead(404, { 'Content-Type': 'text/html' });
                            res.end(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <title>404 - Страница не найдена</title>
                                    <style>
                                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                                        h1 { color: #e74c3c; }
                                    </style>
                                </head>
                                <body>
                                    <h1>404 - Страница не найдена</h1>
                                    <p>Запрашиваемый файл не найден.</p>
                                    <a href="/">Вернуться на главную</a>
                                </body>
                                </html>
                            `);
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html' });
                            res.end(spaContent, 'utf-8');
                        }
                    });
                } else {
                    // 404 - статический ресурс не найден
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>404 - Страница не найдена</title>
                            <style>
                                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                                h1 { color: #e74c3c; }
                            </style>
                        </head>
                        <body>
                            <h1>404 - Страница не найдена</h1>
                            <p>Запрашиваемый файл не найден.</p>
                            <a href="/">Вернуться на главную</a>
                        </body>
                        </html>
                    `);
                }
            } else {
                // 500 - ошибка сервера
                res.writeHead(500);
                res.end(`Ошибка сервера: ${error.code}`);
            }
        } else {
            // 200 - успешно
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`🚀 Frontend сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 Обслуживает файлы из: ${__dirname}`);
    console.log(`🔗 Backend API: http://localhost:3001/api`);
    console.log(`📚 Swagger docs: http://localhost:3001/api/docs`);
});

// Обработка ошибок
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Порт ${PORT} уже используется. Попробуйте другой порт.`);
    } else {
        console.error('❌ Ошибка сервера:', err);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Получен SIGTERM, завершаем сервер...');
    server.close(() => {
        console.log('✅ Сервер завершен');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 Получен SIGINT, завершаем сервер...');
    server.close(() => {
        console.log('✅ Сервер завершен');
        process.exit(0);
    });
});
