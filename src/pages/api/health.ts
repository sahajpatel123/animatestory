import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import IORedis from 'ioredis'
import { spawnSync } from 'node:child_process'
import { getAdminClient } from '@/server/storage/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const checks: Record<string, { ok: boolean; detail?: string }> = {}
  try {
    checks.env = { ok: Boolean(process.env.OPENAI_API_KEY && process.env.REDIS_URL && process.env.DATABASE_URL) }
    // DB
    const prisma = new PrismaClient()
    await prisma.$queryRaw`SELECT 1`
    checks.db = { ok: true }
    // Redis
    const redis = new IORedis(process.env.REDIS_URL!)
    await redis.ping()
    await redis.quit()
    checks.redis = { ok: true }
    // ffmpeg/ffprobe versions
    const ff = spawnSync('ffmpeg', ['-version'])
    const fp = spawnSync('ffprobe', ['-version'])
    checks.ffmpeg = { ok: ff.status === 0, detail: ff.stdout?.toString().split('\n')[0] }
    checks.ffprobe = { ok: fp.status === 0, detail: fp.stdout?.toString().split('\n')[0] }
    // Supabase
    checks.supabase = { ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) }
    // try signed upload (PUT) to test credentials without persisting
    try {
      const supa = getAdminClient()
      const { data, error } = await supa.storage.from('assets').createSignedUrl('health/probe.txt', 60)
      checks.supabaseSignedPut = { ok: !error }
    } catch {
      checks.supabaseSignedPut = { ok: false }
    }
    const status = Object.values(checks).every(c => c.ok) ? 200 : 500
    res.status(status).json({ ok: status === 200, checks })
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message, checks })
  }
}


