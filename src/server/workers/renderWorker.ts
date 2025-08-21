import { PrismaClient } from '@prisma/client'
import { createRenderWorker } from '@/lib/queue'
import { renderMp4 } from '@/lib/ffmpeg'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const prisma = new PrismaClient()

async function processProject(projectId: string) {
  const project = await prisma.projects.findUnique({ where: { id: projectId } })
  if (!project) return

  // Placeholder rendering: assume frames exist at /tmp/frames/frame_%05d.png and mix at /tmp/mix.wav
  const fps = project.target_sec >= 240 ? 30 : 24
  const width = project.target_sec >= 240 ? 1920 : 1280
  const height = project.target_sec >= 240 ? 1080 : 720
  const out = path.join('/tmp', `${randomUUID()}.mp4`)
  await renderMp4('/tmp/frames/frame_%05d.png', '/tmp/mix.wav', out, fps)

  await prisma.renders.create({ data: {
    project_id: projectId,
    url: out,
    fps,
    width,
    height,
    runtime_ms: project.target_sec * 1000,
  } })

  await prisma.projects.update({ where: { id: projectId }, data: { status: 'rendered' } })
}

createRenderWorker(processProject)


