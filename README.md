# Mindshare Proxy Service

A lightweight proxy service that routes traffic to multiple Mindshare Discord bot instances on the same domain.

## What It Does

Routes requests based on URL path:
- `/network` → Bot A (Original network)
- `/fogochain` → Bot B (FogoChain network)
- `/health` → Health check endpoint

## Deployment to Railway

### Step 1: Deploy This Repo to Railway

1. Go to Railway dashboard
2. Click **"+ New Service"**
3. Select **"Deploy from GitHub repo"**
4. Choose this repository: `mindshare-proxy`
5. Railway will automatically detect and deploy it

### Step 2: Add Environment Variables

In Railway, go to your proxy service → **Variables** tab and add:

```
BOT_A_URL=https://your-bot-a-url.railway.app
BOT_B_URL=https://your-bot-b-url.railway.app
```

**Important:** Use the Railway-generated URLs for your bot services, NOT custom domains!

### Step 3: Connect Custom Domain

1. Go to proxy service → **Settings** → **Networking**
2. Click **"+ Custom Domain"**
3. Add your domain (e.g., `mindshare.cachio.xyz`)
4. Update DNS records if needed

### Step 4: Test

Visit your endpoints:
- `https://yourdomain.com/network` → Bot A dashboard
- `https://yourdomain.com/fogochain` → Bot B dashboard
- `https://yourdomain.com/health` → Proxy health check

## Adding More Routes

To add more bot endpoints (e.g., `/ethereum`, `/solana`):

1. Deploy new bot to Railway
2. Add environment variable: `BOT_C_URL=https://bot-c-url.railway.app`
3. Edit `index.js` and add new route:

```javascript
app.use('/ethereum', createProxyMiddleware({
  target: process.env.BOT_C_URL,
  changeOrigin: true
}));
```

4. Commit and push changes
5. Railway auto-deploys
6. New endpoint is live!

## Architecture

```
User Request
    ↓
Custom Domain (mindshare.cachio.xyz)
    ↓
Proxy Service (This service)
    ↓
    ├─ /network → Bot A (Railway Service)
    ├─ /fogochain → Bot B (Railway Service)
    └─ /health → Health check
```

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
export BOT_A_URL=http://localhost:4001
export BOT_B_URL=http://localhost:4002

# Start proxy
npm start
```

## Troubleshooting

**502 Bad Gateway Error:**
- Check that `BOT_A_URL` and `BOT_B_URL` environment variables are set correctly
- Verify that both bot services are running and accessible
- Check Railway logs for errors

**404 Not Found:**
- Verify the URL path is correct (`/network` or `/fogochain`)
- Check proxy logs to see if request is being received

**Proxy not starting:**
- Check Railway logs for error messages
- Ensure environment variables are set
- Verify `package.json` and `index.js` are present

## License

MIT
