import type { NextApiRequest, NextApiResponse } from 'next'
import { installGlobalErrorHandlers } from '@/lib/errors'

export const config = { runtime: 'nodejs' }

installGlobalErrorHandlers()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { jobId } = req.query
    if (!jobId || Array.isArray(jobId)) return res.status(400).json({ ok: false, error: 'jobId required' })

    const { getJob } = await import('@/lib/queue')
    const job = await getJob(String(jobId))
    if (!job) return res.status(404).json({ ok: false, error: 'job not found' })
    const state = await job.getState()
    const progress = typeof job.progress === 'number' ? job.progress : 0
    return res.status(200).json({ ok: true, state, progress })
  } catch (e: any) {
    console.error('[api/status]', e)
    return res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}


