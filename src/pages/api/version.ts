import type { NextApiRequest, NextApiResponse } from 'next'
import { installGlobalErrorHandlers } from '@/lib/errors'

export const config = { runtime: 'nodejs' }

installGlobalErrorHandlers()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const buildId = process.env.NEXT_BUILD_ID || process.env.VERCEL_GIT_COMMIT_SHA || null
    res.status(200).json({ ok: true, buildId, node: process.version, uptime: process.uptime() })
  } catch (e: any) {
    console.error('[api/version]', e)
    res.status(200).json({ ok: true, node: process.version, uptime: process.uptime() })
  }
}
