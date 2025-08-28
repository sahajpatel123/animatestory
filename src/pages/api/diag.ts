import type { NextApiRequest, NextApiResponse } from 'next'
import { installGlobalErrorHandlers } from '@/lib/errors'

export const config = { runtime: 'nodejs' }

installGlobalErrorHandlers()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const required = [
      'PUBLIC_WEB_ORIGIN','REDIS_URL','FIREBASE_STORAGE_BUCKET','HLS_PUBLIC_BASE',
      'JWT_SECRET','QUEUE_DASH_USER','QUEUE_DASH_PASS'
    ]
    const eitherCreds = [
      'GOOGLE_APPLICATION_CREDENTIALS_JSON','GOOGLE_APPLICATION_CREDENTIALS_B64','GOOGLE_APPLICATION_CREDENTIALS'
    ]

    const presence: Record<string, boolean> = {}
    for (const k of required) presence[k] = Boolean(process.env[k])
    presence['GOOGLE_CREDS_PRESENT'] = eitherCreds.some(k => Boolean(process.env[k]))

    // module presence
    let hasFfmpegStatic = false
    let hasFfprobeStatic = false
    try { require.resolve('ffmpeg-static'); hasFfmpegStatic = true } catch {}
    try { require.resolve('ffprobe-static'); hasFfprobeStatic = true } catch {}

    res.status(200).json({
      ok: true,
      node: process.version,
      port: process.env.PORT || null,
      publicOrigin: process.env.PUBLIC_WEB_ORIGIN || null,
      presence,
      modules: { ffmpegStatic: hasFfmpegStatic, ffprobeStatic: hasFfprobeStatic },
    })
  } catch (e: any) {
    console.error('[api/diag]', e)
    res.status(200).json({ ok: true, note: 'diag suppression', error: String(e?.message || e) })
  }
}
