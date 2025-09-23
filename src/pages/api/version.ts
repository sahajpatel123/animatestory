import type { NextApiRequest, NextApiResponse } from 'next'
export const config = { runtime: 'nodejs' }

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({
    ok: true,
    buildId: process.env.NEXT_BUILD_ID || process.env.VERCEL_GIT_COMMIT_SHA || process.env.RAILWAY_GIT_COMMIT_SHA || 'local',
    node: process.version,
    startedAt: process.env.BOOT_TIME || new Date(Number(process.uptime() * 1000)).toISOString()
  })
}
