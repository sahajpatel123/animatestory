import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = (req.query.id as string) || ''
  if (!id) return res.status(400).json({ error: 'id required' })
  const render = await prisma.renders.findFirst({ where: { project_id: id }, orderBy: { created_at: 'desc' } })
  if (!render) return res.status(404).json({ error: 'not found' })
  return res.status(200).json({ url: render.url })
}


