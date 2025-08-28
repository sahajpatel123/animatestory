import type { NextApiRequest, NextApiResponse } from 'next'
import jwt from 'jsonwebtoken'
import { isPromptSafe } from '@/lib/guardrails'
import { upsertProject } from '@/repos/projects'
import { randomUUID } from 'node:crypto'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'Unauthorized' })
    const token = auth.replace('Bearer ', '')
    jwt.verify(token, process.env.JWT_SECRET || 'devsecret')

    const { title, prompt, targetSec = 240, style = 'default' } = req.body || {}
    if (!isPromptSafe(prompt)) return res.status(400).json({ error: 'Unsafe or invalid prompt' })

    const id = randomUUID()
    try {
      const project = await upsertProject({ id, title, prompt, targetSec: Number(targetSec), style, status: 'new' })
      return res.status(201).json({ id: project.id })
    } catch (e: any) {
      if (e?.status === 501) return res.status(501).json({ error: 'DB disabled' })
      throw e
    }
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Internal error' })
  }
}


