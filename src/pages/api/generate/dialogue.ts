import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { validateDialogue, wrapCaption } from '@/lib/dialogue'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { projectId } = req.body || {}
  if (!projectId) return res.status(400).json({ error: 'projectId required' })

  const project = await prisma.projects.findUnique({ where: { id: projectId } })
  if (!project) return res.status(404).json({ error: 'project not found' })

  const scenes = await prisma.scenes.findMany({ where: { project_id: project.id }, orderBy: { index: 'asc' } })
  const shotsByScene = await Promise.all(
    scenes.map((s) => prisma.shots.findMany({ where: { scene_id: s.id }, orderBy: { index: 'asc' } }))
  )

  // Produce placeholder dialogue: 1-3 lines per scene, <=16 words each
  const updates = [] as Array<Promise<any>>
  for (let si = 0; si < scenes.length; si++) {
    const s = scenes[si]
    const shots = shotsByScene[si]

    const numLines = 1 + (si % 3)
    for (let li = 0; li < numLines && li < shots.length; li++) {
      const speaker = si % 2 === 0 ? 'Alex' : 'Rin'
      // short line compliant with word limits
      const text = `We move forward, ${s.title.toLowerCase()} awaits.`
      const caption = wrapCaption(text, 42).slice(0, 2).join('\n')
      updates.push(prisma.dialogue_lines.create({ data: {
        scene_id: s.id,
        idx: li,
        speaker,
        text,
        est_ms: Math.min(shots[li]?.duration_ms ?? 4000, 6000),
        start_ms: 0,
        end_ms: 0,
        tts_voice: speaker === 'Alex' ? 'en_male_1' : 'en_female_1',
      } }))
      // store caption onto shot
      updates.push(prisma.shots.update({ where: { id: shots[li].id }, data: { caption } }))
    }
  }

  await prisma.$transaction(updates)

  // Validate
  const assembledScenes = await prisma.scenes.findMany({ where: { project_id: project.id }, orderBy: { index: 'asc' }, include: { shots: true, dialogue: { orderBy: { idx: 'asc' } } } })
  const prepared = assembledScenes.map(s => ({
    index: s.index,
    title: s.title,
    mood: s.mood,
    targetMs: s.target_ms,
    shots: s.shots.map(sh => ({ index: sh.index, durationMs: sh.duration_ms, camera: sh.camera, backgroundPrompt: sh.background_prompt, caption: sh.caption, dialogue: undefined as any })),
  }))

  const v = validateDialogue(prepared as any, project.target_sec)
  if (!v.ok) return res.status(400).json({ errors: v.errors })

  await prisma.projects.update({ where: { id: project.id }, data: { status: 'dialogue' } })

  return res.status(200).json({ progress: { state: 'dialogue', pct: 40 } })
}


