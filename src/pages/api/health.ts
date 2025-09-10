import type { NextApiRequest, NextApiResponse } from 'next'
import { loadEnv, validateRequiredEnv } from '@/config/env'
import { installGlobalErrorHandlers } from '@/lib/errors'
import { SAFE_MODE } from '@/lib/safe'
import { FFMPEG_PATH, FFPROBE_PATH } from '@/server/ffmpegPaths'
import { LIMITS } from '@/server/guardrails'

export const config = { runtime: 'nodejs' }

installGlobalErrorHandlers()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks: any = { env: {}, redis: {}, storage: {}, db: {}, ffmpeg: {} }

  try {
    // SAFE_MODE: only env + module presence, no heavy deps
    if (SAFE_MODE) {
      const envValidation = validateRequiredEnv()
      checks.env = { ok: envValidation.ok, missing: envValidation.missing, warnings: envValidation.warnings }
      checks.redis = { ok: false, skipped: true }
      checks.storage = { ok: false, skipped: true }
      checks.db = { enabled: false, kind: 'none', ok: true }
      checks.ffmpeg = { ok: true, note: 'skipped in SAFE_MODE', ffmpegPath: FFMPEG_PATH, ffprobePath: FFPROBE_PATH }
      return res.status(200).json({ ok: checks.env.ok, safeMode: true, checks })
    }

    // Env validation
    const envValidation = validateRequiredEnv()
    checks.env = { ok: envValidation.ok, missing: envValidation.missing, warnings: envValidation.warnings }

    // Redis (lazy import)
    try {
      const ENV = loadEnv()
      const IORedis = (await import('ioredis')).default
      const redis = new IORedis(ENV.REDIS_URL || 'redis://localhost:6379')
      const ping = await redis.ping()
      await redis.quit()
      checks.redis = { ok: true, detail: ping }
    } catch (e: any) {
      checks.redis = { ok: false, error: e?.message || String(e) }
    }

    // Storage bucket exists (import lazily)
    try {
      const { getBucket } = await import('@/server/firebase')
      const bucket = await getBucket()
      const [exists] = await bucket.exists()
      checks.storage = { ok: exists, bucket: bucket.name }
    } catch (e: any) {
      checks.storage = { ok: false, error: e?.message || String(e) }
    }

    // DB check (only Firebase RTDB; never Postgres)
    const ENV = loadEnv()
    if (ENV.USE_DB && ENV.DB_KIND === 'realtimedb') {
      try {
        const { getRtdb } = await import('@/server/firebase')
        const rtdb = await getRtdb()
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

    // FFmpeg info (lazy import of startup)
    try {
      const { resolveFfmpeg } = await import('@/server/ffmpegPaths')
      const { ffmpeg, ffprobe } = await resolveFfmpeg()
      checks.ffmpeg = { ok: true, ffmpegPath: ffmpeg, ffprobePath: ffprobe }
    } catch (e: any) {
      checks.ffmpeg = { ok: false, error: e?.message || String(e) }
    }

    // Guardrails summary (optional projectId)
    const projectId = (req.query.projectId as string) || ''
    checks.guardrails = { limits: LIMITS }
    if (projectId) {
      try {
        const { getRtdb } = await import('@/server/firebase')
        const rtdb = getRtdb()
        const snap = await rtdb.ref(`/projects/${projectId}/plan/validation`).get()
        if (snap.exists()) checks.guardrails.lastValidation = snap.val()
      } catch {}
    }

    const baseOk = checks.env.ok && checks.redis.ok && checks.storage.ok
    const ok = baseOk && checks.db.ok
    res.status(ok ? 200 : 500).json({ ok, checks })
  } catch (e: any) {
    console.error('[api/health]', e)
    res.status(200).json({ ok: false, error: e?.message, checks })
  }
}


