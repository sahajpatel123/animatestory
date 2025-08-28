# Railway Deployment Guide

## Prerequisites

Ensure you have the following environment variables configured in Railway:

### Required Environment Variables

```bash
# Core Infrastructure
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
PORT=3000

# Firebase Storage
FIREBASE_STORAGE_BUCKET=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Public Web Origin (should point to your Railway domain)
PUBLIC_WEB_ORIGIN=https://your-app-name.railway.app

# API Keys (at least one required for each service)
OPENAI_API_KEY=sk-...
STABILITY_API_KEY=sk-...
ELEVENLABS_API_KEY=sk-...
HUGGINGFACE_API_KEY=hf_...
PIKA_API_KEY=tfp_...
STABLE_AUDIO_API_KEY=sk-...
FREESOUND_API_KEY=...
JWT_SECRET=your-secret-key

# Queue Dashboard (optional)
QUEUE_DASH_USER=admin
QUEUE_DASH_PASS=secure-password
```

## Deployment Steps

1. **Connect your GitHub repository to Railway**
2. **Set all required environment variables in Railway dashboard**
3. **Deploy using the Railway dashboard or CLI**

## Health Check

The application includes a comprehensive health check endpoint at `/api/health` that:

- ✅ Validates all required environment variables
- ✅ Tests database connectivity
- ✅ Tests Redis connectivity with ping
- ✅ Checks FFmpeg availability (with fallbacks)
- ✅ Validates Supabase configuration
- ✅ Returns detailed diagnostic information

## FFmpeg Configuration

FFmpeg is configured with fallbacks:
1. **System FFmpeg** (if available via nixpacks)
2. **ffmpeg-static** (Node.js package fallback)
3. **ffprobe-static** (Node.js package fallback)

## Troubleshooting

### 500 Internal Server Error

1. **Check Railway logs** for startup validation errors
2. **Verify all required environment variables** are set
3. **Check the health endpoint** at `/api/health`
4. **Ensure Redis is reachable** from your Railway service
5. **Validate Google credentials** are proper JSON format

### Common Issues

- **Missing PUBLIC_WEB_ORIGIN**: Set to your Railway domain
- **Invalid GOOGLE_APPLICATION_CREDENTIALS_JSON**: Must be valid JSON with project_id
- **Redis connection failed**: Check REDIS_URL format and accessibility
- **Database connection failed**: Verify DATABASE_URL and network access

## Local Testing

Test the health endpoint locally:

```bash
npm run test:health
```

This will:
1. Validate startup configuration
2. Start a dev server
3. Test the health endpoint
4. Report results

## Monitoring

The health endpoint provides real-time status of:
- Environment variables
- Database connectivity
- Redis connectivity
- FFmpeg availability
- Supabase configuration
- Service configuration details

Use this for monitoring and debugging production issues.
