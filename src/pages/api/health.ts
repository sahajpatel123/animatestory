import type { NextApiRequest, NextApiResponse } from 'next'
import IORedis from 'ioredis'
import { getStartupConfig } from '@/lib/startup'
import { ENV, validateRequiredEnv } from '@/config/env'
import { getBucket, getRtdb } from '@/server/firebase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks: any = { env: {}, redis: {}, storage: {}, db: {}, ffmpeg: {} }

  try {
    // Env validation
    const envValidation = validateRequiredEnv()
    checks.env = { ok: envValidation.ok, missing: envValidation.missing, warnings: envValidation.warnings }

    // Redis
    try {
      const redis = new IORedis(ENV.REDIS_URL)
      const ping = await redis.ping()
      await redis.quit()
      checks.redis = { ok: true, detail: ping }
    } catch (e: any) {
      checks.redis = { ok: false, error: e.message }
    }

    // Storage bucket exists
    try {
      const bucket = getBucket()
      const [exists] = await bucket.exists()
      checks.storage = { ok: exists, bucket: bucket.name }
    } catch (e: any) {
      checks.storage = { ok: false, error: e.message }
    }

    // DB check
    if (ENV.USE_DB && ENV.DB_KIND === 'realtimedb') {
      try {
        const rtdb = getRtdb()
        if (!rtdb) throw new Error('RTDB not available')
        // attempt a trivial read of .info/connected
        const snap = await rtdb.ref('.info/connected').get()
        const connected = !!snap.val()
        checks.db = { enabled: true, kind: 'realtimedb', ok: connected }
      } catch (e: any) {
        checks.db = { enabled: true, kind: 'realtimedb', ok: false, error: e.message }
      }
    } else {
      checks.db = { enabled: false, kind: 'none', ok: true }
    }

    // FFmpeg info
    const cfg = getStartupConfig()
    checks.ffmpeg = { ok: true, ffmpegPath: cfg.ffmpegPath, ffprobePath: cfg.ffprobePath }

    const baseOk = checks.env.ok && checks.redis.ok && checks.storage.ok
    const ok = baseOk && checks.db.ok
    res.status(ok ? 200 : 500).json({ ok, checks })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message, checks })
  }
}


