const express = require('express');
const path = require('path');
const { createServer } = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOSTNAME || '0.0.0.0';

// 1. Explicitly serve the dynamic uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
    maxAge: '1d',
    fallthrough: false,
}));

// 2. Wrap Next.js standalone handler
const nextStandaloneHandler = require('./.next/standalone/server.js');

// Fix for Express 5 catch-all routing
app.use((req, res, next) => {
    return nextStandaloneHandler(req, res);
});

const server = createServer(app);
server.listen(PORT, HOST, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${HOST}:${PORT} (Standalone with Uploads proxy)`);
});
