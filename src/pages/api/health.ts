import type { NextApiRequest, NextApiResponse } from 'next'
import { getStartupConfig } from '@/lib/startup'
import { ENV, validateRequiredEnv } from '@/config/env'
import { installGlobalErrorHandlers } from '@/lib/errors'

export const config = { runtime: 'nodejs' }

installGlobalErrorHandlers()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks: any = { env: {}, redis: {}, storage: {}, db: {}, ffmpeg: {} }

  try {
    // Env validation
    const envValidation = validateRequiredEnv()
    checks.env = { ok: envValidation.ok, missing: envValidation.missing, warnings: envValidation.warnings }

    // Redis (lazy import)
    try {
      const IORedis = (await import('ioredis')).default
      const redis = new IORedis(ENV.REDIS_URL)
      const ping = await redis.ping()
      await redis.quit()
      checks.redis = { ok: true, detail: ping }
    } catch (e: any) {
      checks.redis = { ok: false, error: e?.message || String(e) }
    }

    // Storage bucket exists (import lazily)
    try {
      const { getBucket } = await import('@/server/firebase')
      const bucket = getBucket()
      const [exists] = await bucket.exists()
      checks.storage = { ok: exists, bucket: bucket.name }
    } catch (e: any) {
      checks.storage = { ok: false, error: e?.message || String(e) }
    }

    // DB check (lazy import)
    if (ENV.USE_DB && ENV.DB_KIND === 'realtimedb') {
      try {
        const { getRtdb } = await import('@/server/firebase')
        const rtdb = getRtdb()
        if (!rtdb) throw new Error('RTDB not available')
        const snap = await rtdb.ref('.info/connected').get()
        const connected = !!snap.val()
        checks.db = { enabled: true, kind: 'realtimedb', ok: connected }
      } catch (e: any) {
        checks.db = { enabled: true, kind: 'realtimedb', ok: false, error: e?.message || String(e) }
      }
    } else {
      checks.db = { enabled: false, kind: 'none', ok: true }
    }

    // FFmpeg info
    try {
      const cfg = getStartupConfig()
      checks.ffmpeg = { ok: true, ffmpegPath: cfg.ffmpegPath, ffprobePath: cfg.ffprobePath }
    } catch (e: any) {
      checks.ffmpeg = { ok: false, error: e?.message || String(e) }
    }

    const baseOk = checks.env.ok && checks.redis.ok && checks.storage.ok
    const ok = baseOk && checks.db.ok
    res.status(ok ? 200 : 500).json({ ok, checks })
  } catch (e: any) {
    console.error('[api/health]', e)
    res.status(500).json({ ok: false, error: e?.message, checks })
  }
}


