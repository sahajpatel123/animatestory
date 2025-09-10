import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs-extra'
import path from 'node:path'
import { resolveFfmpeg } from '@/server/ffmpegPaths'

export const config = { runtime: 'nodejs' }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const projectId = (req.query.projectId as string) || ''
  if (!projectId) return res.status(400).json({ ok: false, error: 'projectId required' })
  try {
    const { ffmpeg: FFMPEG_PATH, ffprobe: FFPROBE_PATH } = await resolveFfmpeg()
    const base = path.join('/tmp', projectId)
    const groups = ['shots','audio','music','sfx','captions','scenes','final']
    const files: Record<string, string[]> = {}
    for (const g of groups) {
      const dir = path.join(base, g)
      files[g] = (await fs.pathExists(dir)) ? await fs.readdir(dir) : []
    }

    const env = {
      FIREBASE_STORAGE_BUCKET: !!process.env.FIREBASE_STORAGE_BUCKET,
      GOOGLE_APPLICATION_CREDENTIALS_JSON: !!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || !!process.env.GOOGLE_APPLICATION_CREDENTIALS_B64,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      STABILITY_API_KEY: !!process.env.STABILITY_API_KEY,
      ELEVENLABS_API_KEY: !!process.env.ELEVENLABS_API_KEY || !!process.env.ELEVEN_API_KEY,
      FREESOUND_API_KEY: !!process.env.FREESOUND_API_KEY,
      STABLE_AUDIO_API_KEY: !!process.env.STABLE_AUDIO_API_KEY,
    }

    let ffmpegVersion = 'unknown'; let ffprobeVersion = 'unknown'
    try {
      const { spawnSync } = await import('node:child_process')
      ffmpegVersion = (spawnSync(FFMPEG_PATH || 'ffmpeg', ['-version']).stdout || Buffer.from('')).toString().split('\n')[0]
      ffprobeVersion = (spawnSync(FFPROBE_PATH || 'ffprobe', ['-version']).stdout || Buffer.from('')).toString().split('\n')[0]
    } catch {}

    let planPresent = false
    let renderPresent = false
    try {
      const { getRtdb } = await import('@/server/firebase')
      const rtdb = getRtdb()
      planPresent = (await rtdb.ref(`/projects/${projectId}/plan`).get()).exists()
      renderPresent = (await rtdb.ref(`/renders/${projectId}`).get()).exists()
    } catch {}

    let cacheKeys: Record<string, number> = {}
    try {
      const { getRtdb } = await import('@/server/firebase')
      const rtdb = getRtdb()
      const caches = ['/cache/dialoguePlans','/cache/visuals','/cache/tts','/cache/bgm','/cache/sfx']
      for (const c of caches) {
        const snap = await rtdb.ref(c).limitToLast(20).get()
        if (snap.exists()) cacheKeys[c] = Object.keys(snap.val() || {}).length
      }
    } catch {}

    return res.status(200).json({ ok: true, projectId, planPresent, renderPresent, files, env, paths: { ffmpeg: FFMPEG_PATH, ffprobe: FFPROBE_PATH }, ffmpeg: { ffmpegVersion, ffprobeVersion }, cacheKeys })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || 'diag error' })
  }
}


