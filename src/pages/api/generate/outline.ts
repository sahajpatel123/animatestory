import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { projectId } = req.body || {}
  if (!projectId) return res.status(400).json({ error: 'projectId required' })

  // For MVP, generate 12 scenes over 3 acts
  const project = await prisma.projects.findUnique({ where: { id: projectId } })
  if (!project) return res.status(404).json({ error: 'project not found' })

  const totalScenes = 12
  const perAct = [0, 0, 0]
  // 4-4-4 split
  perAct[0] = 4; perAct[1] = 4; perAct[2] = 4

  const scenes = Array.from({ length: totalScenes }, (_, i) => ({
    index: i,
    title: `Scene ${i + 1}`,
    mood: i < 4 ? 'setup' : i < 8 ? 'confrontation' : 'resolution',
    target_ms: Math.round((project.target_sec * 1000) / totalScenes),
  }))

  // persist
  await prisma.$transaction(async (tx) => {
    for (const s of scenes) {
      await tx.scenes.create({ data: { project_id: project.id, index: s.index, title: s.title, mood: s.mood, target_ms: s.target_ms } })
    }
    await tx.projects.update({ where: { id: project.id }, data: { status: 'outline' } })
  })

  return res.status(200).json({
    acts: ['Act I', 'Act II', 'Act III'],
    scenes: scenes.map(s => ({ index: s.index, title: s.title, mood: s.mood, targetMs: s.target_ms })),
    progress: { state: 'outline', pct: 10 }
  })
}


