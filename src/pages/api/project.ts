import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { isPromptSafe } from '@/lib/guardrails'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const auth = req.headers.authorization
    if (!auth) return res.status(401).json({ error: 'Unauthorized' })
    const token = auth.replace('Bearer ', '')
    jwt.verify(token, process.env.JWT_SECRET || 'devsecret')

    const { title, prompt, targetSec = 240, style = 'default' } = req.body || {}
    if (!isPromptSafe(prompt)) return res.status(400).json({ error: 'Unsafe or invalid prompt' })

    const project = await prisma.projects.create({
      data: { title, prompt, target_sec: Number(targetSec), style_pack: style, status: 'new' },
    })

    return res.status(201).json({ id: project.id })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Internal error' })
  }
}


