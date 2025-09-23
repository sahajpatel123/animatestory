import type { NextApiRequest, NextApiResponse } from 'next'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const id = (req.query.id as string) || ''
  if (!id) return res.status(400).json({ ok: false, error: 'id required' })
  try {
    const { getRtdb } = await import('@/server/firebase')
    const db = await getRtdb()
    const [planSnap, renderSnap] = await Promise.all([
      db.ref(`/projects/${id}/plan`).get(),
      db.ref(`/renders/${id}`).get(),
    ])
    const plan = planSnap.exists() ? planSnap.val() : null
    const render = renderSnap.exists() ? renderSnap.val() : null
    return res.status(200).json({ ok: true, projectId: id, plan, render })
  } catch (e: any) {
    console.error('[api/project/status]', e)
    return res.status(500).json({ ok: false, error: e?.message || 'status error' })
  }
}


