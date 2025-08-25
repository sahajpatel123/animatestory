import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import { renderQueue } from '@/../worker/renderWorker'
import path from 'node:path'
import fs from 'fs-extra'
import { uploadFileGCS } from '@/../../server/gcsUpload'

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
  const sceneMp4s = (await fs.readdir(workDir)).filter(f => /^scene_\d+\.mp4$/.test(f)).map(f => path.join(workDir, f))
  const finalJob = await renderQueue.add('render:final', { projectId, sceneMp4s, outDir: workDir, targetFps: 30 }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })
  const done = await finalJob.waitUntilFinished(500000)

  // Upload scene MP4s
  const sceneUrls: string[] = []
  for (const localScene of sceneMp4s) {
    const base = path.basename(localScene)
    const key = `renders/${projectId}/scenes/${base}`
    const url = await uploadFileGCS(key, localScene, 3600)
    sceneUrls.push(url)
  }

  // Upload final MP4
  const finalUrl = await uploadFileGCS(`renders/${projectId}/final.mp4`, done.final, 3600)

  // HLS: upload all files in outDir matching .m3u8 and .ts
  const files = await fs.readdir(workDir)
  let hlsUrl: string | null = null
  for (const f of files) {
    if (f.endsWith('.m3u8')) {
      const url = await uploadFileGCS(`hls/${projectId}/${f}`, path.join(workDir, f), 3600)
      hlsUrl = process.env.HLS_PUBLIC_BASE ? `${process.env.HLS_PUBLIC_BASE}${encodeURIComponent(projectId)}%2F${encodeURIComponent(f)}?alt=media` : url
    }
    if (f.endsWith('.ts')) {
      await uploadFileGCS(`hls/${projectId}/${f}`, path.join(workDir, f), 3600)
    }
  }

  await prisma.renders.create({ data: { project_id: projectId, url: finalUrl, fps: 30, width: 1920, height: 1080, runtime_ms: 0 } })

  return res.status(200).json({ finalUrl, hlsUrl, scenes: sceneUrls })
}


