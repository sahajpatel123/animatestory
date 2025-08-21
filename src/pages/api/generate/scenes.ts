import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { scaleRuntimeToTarget } from '@/lib/runtime'
import { Scene } from '@/types/story'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { projectId } = req.body || {}
  if (!projectId) return res.status(400).json({ error: 'projectId required' })

  const project = await prisma.projects.findUnique({ where: { id: projectId } })
  if (!project) return res.status(404).json({ error: 'project not found' })

  const scenesDb = await prisma.scenes.findMany({ where: { project_id: project.id }, orderBy: { index: 'asc' } })
  // For MVP, create 2-4 shots per scene with placeholder content
  let scenes: Scene[] = scenesDb.map((s) => ({
    index: s.index,
    title: s.title,
    mood: s.mood,
    targetMs: s.target_ms,
    shots: Array.from({ length: 2 + (s.index % 3) }, (_, i) => ({
      index: i,
      durationMs: 5000,
      camera: i % 2 === 0 ? 'wide' : 'close',
      backgroundPrompt: `${project.style_pack} ${s.mood} background for ${s.title}`,
      caption: '',
    }))
  }))

  scenes = scaleRuntimeToTarget(scenes, project.target_sec)

  await prisma.$transaction(async (tx) => {
    for (const s of scenes) {
      const sceneId = scenesDb.find(sd => sd.index === s.index)!.id
      // remove existing
      await tx.shots.deleteMany({ where: { scene_id: sceneId } })
      for (const shot of s.shots) {
        await tx.shots.create({ data: {
          scene_id: sceneId,
          index: shot.index,
          duration_ms: shot.durationMs,
          camera: shot.camera,
          background_prompt: shot.backgroundPrompt,
          caption: shot.caption,
        } })
      }
    }
    await tx.projects.update({ where: { id: project.id }, data: { status: 'scenes' } })
  })

  return res.status(200).json({ scenes, progress: { state: 'scenes', pct: 25 } })
}


