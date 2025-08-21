import type { NextApiRequest, NextApiResponse } from 'next'
import { renderQueue } from '@/lib/queue'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { jobId } = req.query
  if (!jobId || Array.isArray(jobId)) return res.status(400).json({ error: 'jobId required' })

  const job = await renderQueue.getJob(jobId)
  if (!job) return res.status(404).json({ error: 'job not found' })
  const state = await job.getState()
  const progress = typeof job.progress === 'number' ? job.progress : 0
  return res.status(200).json({ state, progress })
}


