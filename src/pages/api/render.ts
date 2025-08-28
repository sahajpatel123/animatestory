import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'node:path'
import fs from 'fs-extra'
import { installGlobalErrorHandlers } from '@/lib/errors'

export const config = { runtime: 'nodejs' }

installGlobalErrorHandlers()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).end()
    const { projectId } = req.body || {}
    if (!projectId) return res.status(400).json({ ok: false, error: 'projectId required' })

    const { renderQueue } = await import('@/../worker/renderWorker')
    const { QueueEvents } = await import('bullmq')
    const IORedis = (await import('ioredis')).default
    const { uploadFileGCS: uploadFile } = await import('@/../../server/gcsUpload')
    const { storeRenderRecord, storeManifest } = await import('@/repos/renders')

    const workDir = path.join('/tmp', projectId)
    await fs.ensureDir(workDir)

    const filesExisting = await fs.readdir(workDir)
    const sceneMp4s = filesExisting.filter(f => /^scene_\d+\.mp4$/.test(f)).map(f => path.join(workDir, f))

    const finalJob = await renderQueue.add('render:final', { projectId, sceneMp4s, outDir: workDir, targetFps: 30 }, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } })
    const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')
    const events = new QueueEvents('render-queue', { connection })
    const done: any = await finalJob.waitUntilFinished(events, 500000)

    const sceneUrls: string[] = []
    for (const localScene of sceneMp4s) {
      const base = path.basename(localScene)
      const key = `${projectId}/scenes/${base}`
      const url = await uploadFile(key, localScene, 31536000)
      sceneUrls.push(url)
    }

    const finalUrl = await uploadFile(`${projectId}/final.mp4`, done.final, 31536000)

    const files = await fs.readdir(workDir)
    let hlsUrl: string | null = null
    for (const f of files) {
      if (f.endsWith('.m3u8')) {
        const url = await uploadFile(`${projectId}/${f}`, path.join(workDir, f), 600)
        hlsUrl = url
      }
      if (f.endsWith('.ts')) {
        await uploadFile(`${projectId}/${f}`, path.join(workDir, f), 31536000)
      }
    }

    try {
      await storeRenderRecord({ projectId, url: finalUrl, hlsUrl: hlsUrl || undefined })
      const manifestPath = path.join(workDir, 'render_manifest.json')
      if (await fs.pathExists(manifestPath)) {
        const manifest = await fs.readJSON(manifestPath)
        await storeManifest(projectId, manifest)
      }
    } catch (e: any) {
      if (e?.status === 501) {
        await events.close(); await connection.quit()
        return res.status(501).json({ ok: false, error: 'DB disabled', finalUrl, hlsUrl, scenes: sceneUrls })
      }
      throw e
    }

    await events.close()
    await connection.quit()

    return res.status(200).json({ ok: true, finalUrl, hlsUrl, scenes: sceneUrls })
  } catch (e: any) {
    console.error('[api/render]', e)
    return res.status(500).json({ ok: false, error: String(e?.message || e) })
  }
}


