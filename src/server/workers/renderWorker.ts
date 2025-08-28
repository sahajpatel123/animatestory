import { createRenderWorker } from '@/lib/queue'
import { renderMp4 } from '@/lib/ffmpeg'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

async function processProject(projectId: string) {
  // Placeholder rendering: assume frames exist at /tmp/frames/frame_%05d.png and mix at /tmp/mix.wav
  const fps = 30
  const width = 1920
  const height = 1080
  const out = path.join('/tmp', `${randomUUID()}.mp4`)
  await renderMp4('/tmp/frames/frame_%05d.png', '/tmp/mix.wav', out, fps)
  // no-op: this worker only renders and stores locally; uploader is handled in API
}

createRenderWorker(async (projectId: string) => {
  await processProject(projectId)
})


