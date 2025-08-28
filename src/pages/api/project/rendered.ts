import type { NextApiRequest, NextApiResponse } from 'next'
import { getLatestRender } from '@/repos/renders'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = (req.query.id as string) || ''
  if (!id) return res.status(400).json({ error: 'id required' })
  try {
    const render = await getLatestRender(id)
    if (!render) return res.status(404).json({ error: 'not found' })
    return res.status(200).json({ url: render.url })
  } catch (e: any) {
    if (e?.status === 501) return res.status(501).json({ error: 'DB disabled' })
    throw e
  }
}


