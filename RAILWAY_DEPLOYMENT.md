# Railway Deployment Guide

## Prerequisites

Ensure you have the following environment variables configured in Railway:

### Required Environment Variables

```bash
# Core Infrastructure
REDIS_URL=redis://...
PORT=3000

# Firebase
USE_DB=true
DB_KIND=realtimedb
FIREBASE_DATABASE_URL=https://<project>.firebaseio.com
FIREBASE_STORAGE_BUCKET=<bucket>.appspot.com
HLS_PUBLIC_BASE=https://firebasestorage.googleapis.com/v0/b/<bucket>.appspot.com/o/hls%2F
# One of:
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
# or
GOOGLE_APPLICATION_CREDENTIALS_B64=eyJ...
# or
GOOGLE_APPLICATION_CREDENTIALS=/app/service-account.json

# Public Web Origin (should point to your Railway domain)
PUBLIC_WEB_ORIGIN=https://your-app-name.railway.app

# Security/ops
JWT_SECRET=your-secret-key
QUEUE_DASH_USER=admin
QUEUE_DASH_PASS=secure-password
LOG_LEVEL=info

# Providers (optional)
OPENAI_API_KEY=sk-...
STABILITY_API_KEY=sk-...
ELEVENLABS_API_KEY=sk-...
HUGGINGFACE_API_KEY=hf_...
PIKA_API_KEY=tfp_...
STABLE_AUDIO_API_KEY=sk-...
FREESOUND_API_KEY=...
```

## Deployment Steps

1. Connect your GitHub repository to Railway
2. Set all required environment variables in Railway dashboard
3. Deploy using the Railway dashboard or CLI

## Health Check

The application includes a comprehensive health check endpoint at `/api/health` that:

- Validates required environment variables and reports missing in `checks.env.missing`
- Tests Redis connectivity
- Confirms Firebase Storage bucket exists
- Confirms Realtime Database connectivity when enabled (`db.kind = 'realtimedb'`)
- Reports FFmpeg paths (with static fallback)

## Troubleshooting

- Missing PUBLIC_WEB_ORIGIN: Set to your Railway domain
- Invalid Google credentials JSON or B64: ensure valid service account
- Redis connection failed: check REDIS_URL format and accessibility
- RTDB connectivity: verify FIREBASE_DATABASE_URL and credentials

## Local Testing

```bash
npm run dev
# open http://localhost:3000/api/health
```
