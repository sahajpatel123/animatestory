import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import type { StoryJSON } from '@/types/story'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = (req.query.id as string) || ''
  if (!id) return res.status(400).json({ error: 'id required' })
  const project = await prisma.projects.findUnique({ where: { id } })
  if (!project) return res.status(404).json({ error: 'not found' })

  const scenesDb = await prisma.scenes.findMany({ where: { project_id: id }, orderBy: { index: 'asc' }, include: { shots: { orderBy: { index: 'asc' } }, dialogue: { orderBy: { idx: 'asc' } } } })

  const scenes = scenesDb.map(s => ({
    index: s.index,
    title: s.title,
    mood: s.mood,
    targetMs: s.target_ms,
    shots: s.shots.map(sh => ({
      index: sh.index,
      durationMs: sh.duration_ms,
      camera: sh.camera,
      backgroundPrompt: sh.background_prompt,
      caption: sh.caption,
      dialogue: undefined as any,
    }))
  }))

  const story: StoryJSON = {
    project: {
      id: project.id,
      title: project.title,
      targetSec: project.target_sec,
      style: project.style_pack,
      characters: [
        { id: 'alex', name: 'Alex', palette: { primary: '#9cf', secondary: '#369' }, poses: ['neutral', 'happy', 'action'], ttsVoice: 'en_male_1' },
        { id: 'rin', name: 'Rin', palette: { primary: '#fc9', secondary: '#963' }, poses: ['neutral', 'happy', 'action'], ttsVoice: 'en_female_1' }
      ],
    },
    acts: ['Act I', 'Act II', 'Act III'],
    scenes,
    assets: [],
    render_plan: { fps: 30, width: 1280, height: 720, audioMix: { ducking: true } }
  }

  return res.status(200).json(story)
}


