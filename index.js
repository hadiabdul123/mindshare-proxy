/* =================== MINDSHARE PROXY SERVICE ===================
 * Routes traffic to multiple Discord bot instances
 * Allows multiple /endpoints on the same domain
 * =============================================================== */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Get bot URLs from environment variables
const BOT_A_URL = process.env.BOT_A_URL; // Bot A (/network endpoint)
const BOT_B_URL = process.env.BOT_B_URL; // Bot B (/fogochain endpoint)

// Validate environment variables
if (!BOT_A_URL) {
  console.error('❌ ERROR: BOT_A_URL environment variable is not set!');
  process.exit(1);
}

if (!BOT_B_URL) {
  console.error('❌ ERROR: BOT_B_URL environment variable is not set!');
  process.exit(1);
}

console.log('🔀 Proxy Configuration:');
console.log(`   /network → ${BOT_A_URL}`);
console.log(`   /fogochain → ${BOT_B_URL}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Mindshare Proxy is running',
    routes: {
      '/network': BOT_A_URL,
      '/fogochain': BOT_B_URL,
      '/api/*': `${BOT_A_URL} (default)`,
      '/dashboard.html': BOT_A_URL
    },
    timestamp: Date.now()
  });
});

// Root redirect - show available endpoints
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Mindshare Proxy</title>
        <style>
          body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
          h1 { color: #333; }
          .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 8px; }
          a { color: #0066cc; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Mindshare Proxy Service</h1>
        <p>Available endpoints:</p>
        <div class="endpoint">
          <strong>Network Dashboard:</strong><br>
          <a href="/network">/network</a>
        </div>
        <div class="endpoint">
          <strong>FogoChain Dashboard:</strong><br>
          <a href="/fogochain">/fogochain</a>
        </div>
        <div class="endpoint">
          <strong>Health Check:</strong><br>
          <a href="/health">/health</a>
        </div>
      </body>
    </html>
  `);
});

// Route /network to Bot A
app.use('/network', createProxyMiddleware({
  target: BOT_A_URL,
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req) => {
    console.log('\n========== PROXY DEBUG /network ==========');
    console.log('📥 INCOMING REQUEST:');
    console.log('   req.url:', req.url);
    console.log('   req.path:', req.path);
    console.log('   req.originalUrl:', req.originalUrl);
    console.log('   req.baseUrl:', req.baseUrl);

    console.log('\n📤 OUTGOING REQUEST:');
    console.log('   proxyReq.path:', proxyReq.path);
    console.log('   proxyReq.host:', proxyReq.getHeader('host'));
    console.log('   Full target URL:', `${BOT_A_URL}${proxyReq.path}`);
    console.log('==========================================\n');
  },
  onProxyRes: (proxyRes, req) => {
    console.log(`✅ Response from Bot A: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
  },
  onError: (err, _req, res) => {
    console.error('\n❌ PROXY ERROR for /network:');
    console.error('   Message:', err.message);
    console.error('   Code:', err.code);
    console.error('   Stack:', err.stack);
    res.status(502).send({
      error: 'Bad Gateway',
      message: err.message,
      target: BOT_A_URL
    });
  }
}));

// Route /fogochain to Bot B
app.use('/fogochain', createProxyMiddleware({
  target: BOT_B_URL,
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req) => {
    console.log('\n========== PROXY DEBUG /fogochain ==========');
    console.log('📥 INCOMING REQUEST:');
    console.log('   req.url:', req.url);
    console.log('   req.path:', req.path);
    console.log('   req.originalUrl:', req.originalUrl);
    console.log('   req.baseUrl:', req.baseUrl);

    console.log('\n📤 OUTGOING REQUEST:');
    console.log('   proxyReq.path:', proxyReq.path);
    console.log('   proxyReq.host:', proxyReq.getHeader('host'));
    console.log('   Full target URL:', `${BOT_B_URL}${proxyReq.path}`);
    console.log('==========================================\n');
  },
  onProxyRes: (proxyRes) => {
    console.log(`✅ Response from Bot B: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
  },
  onError: (err, _req, res) => {
    console.error('\n❌ PROXY ERROR for /fogochain:');
    console.error('   Message:', err.message);
    console.error('   Code:', err.code);
    console.error('   Stack:', err.stack);
    res.status(502).send({
      error: 'Bad Gateway',
      message: err.message,
      target: BOT_B_URL
    });
  }
}));

// Route ALL /api/* requests to Bot A (default bot)
// This allows the dashboard to fetch data from /api/guild/*, /api/scan/progress, etc.
app.use('/api', createProxyMiddleware({
  target: BOT_A_URL,
  changeOrigin: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req) => {
    console.log('\n========== PROXY DEBUG /api ==========');
    console.log('📥 INCOMING REQUEST:');
    console.log('   req.url:', req.url);
    console.log('   req.originalUrl:', req.originalUrl);
    console.log('\n📤 OUTGOING REQUEST:');
    console.log('   proxyReq.path:', proxyReq.path);
    console.log('   Full target URL:', `${BOT_A_URL}${proxyReq.path}`);
    console.log('======================================\n');
  },
  onProxyRes: (proxyRes) => {
    console.log(`✅ Response from Bot A (API): ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
  },
  onError: (err, _req, res) => {
    console.error('\n❌ PROXY ERROR for /api:');
    console.error('   Message:', err.message);
    res.status(502).send({
      error: 'Bad Gateway',
      message: err.message,
      target: BOT_A_URL
    });
  }
}));

// Route /dashboard.html to Bot A (in case it's requested directly)
app.use('/dashboard.html', createProxyMiddleware({
  target: BOT_A_URL,
  changeOrigin: true,
  onProxyReq: (proxyReq) => {
    console.log(`📄 Proxying dashboard.html to Bot A: ${BOT_A_URL}${proxyReq.path}`);
  },
  onError: (err, _req, res) => {
    console.error('❌ PROXY ERROR for /dashboard.html:', err.message);
    res.status(502).send({
      error: 'Bad Gateway',
      message: err.message
    });
  }
}));

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).send({
    error: 'Not Found',
    message: 'Endpoint not found',
    availableEndpoints: ['/network', '/fogochain', '/api/*', '/health']
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`✅ Mindshare Proxy running at http://${HOST}:${PORT}`);
  console.log(`📊 Network Dashboard: http://${HOST}:${PORT}/network`);
  console.log(`🔗 FogoChain Dashboard: http://${HOST}:${PORT}/fogochain`);
  console.log(`💚 Health Check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});
