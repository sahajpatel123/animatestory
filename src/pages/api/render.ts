import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { renderQueue } from '@/../worker/renderWorker'
import path from 'node:path'
import fs from 'fs-extra'
import { uploadBuffer } from '@/server/storage/supabase'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { projectId } = req.body || {}
  if (!projectId) return res.status(400).json({ error: 'projectId required' })

  // In a real implementation: gather scenes, assets, dialogue wavs etc.
  // Here we assume assets were generated and staged under /tmp/projectId
  const workDir = path.join('/tmp', projectId)
  await fs.ensureDir(workDir)

  // Enqueue a dummy final job if scenes already exist
  const sceneMp4s = (await fs.readdir(workDir)).filter(f => f.endsWith('.mp4')).map(f => path.join(workDir, f))
  const finalJob = await renderQueue.add('render:final', { projectId, sceneMp4s, outDir: workDir, targetFps: 30 }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })
  const done = await finalJob.waitUntilFinished(500000)

  // Upload outputs to Supabase
  const finalBuf = await fs.readFile(done.final)
  const finalUrl = await uploadBuffer({ bucket: 'renders', path: `${projectId}/final.mp4`, data: finalBuf, contentType: 'video/mp4' })

  // HLS: upload all files in outDir matching .m3u8 and .ts
  const files = await fs.readdir(workDir)
  let hlsUrl: string | null = null
  for (const f of files) {
    if (f.endsWith('.m3u8')) {
      const buf = await fs.readFile(path.join(workDir, f))
      const url = await uploadBuffer({ bucket: 'hls', path: `${projectId}/${f}`, data: buf, contentType: 'application/x-mpegURL', cacheControl: 'public, max-age=600' })
      hlsUrl = url
    }
    if (f.endsWith('.ts')) {
      const buf = await fs.readFile(path.join(workDir, f))
      await uploadBuffer({ bucket: 'hls', path: `${projectId}/${f}`, data: buf, contentType: 'video/MP2T', cacheControl: 'public, max-age=31536000, immutable' })
    }
  }

  await prisma.renders.create({ data: { project_id: projectId, url: finalUrl, fps: 30, width: 1920, height: 1080, runtime_ms: 0 } })

  return res.status(200).json({ finalUrl, hlsUrl })
}


