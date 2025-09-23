import fs from 'fs-extra'
import path from 'node:path'
import crypto from 'node:crypto'
import { getRtdb } from '@/server/firebase'
import { semanticSeed } from '@/lib/seed'

// NOTE: types are expected at '@/types/models'
// Shot { id:string; seed:number; prompt:string; durationMs:number; camera:string }
// Scene { id:string; title:string; shots: Shot[]; lines: Line[] }
export type Shot = { id: string; seed: number; prompt: string; durationMs: number; camera: string }
export type Scene = { id: string; title: string; shots: Shot[]; lines: Array<{ id: string; who: string; text: string; estMs: number }> }

const STABILITY_ENDPOINT = 'https://api.stability.ai/v2beta/stable-image/generate/sd3'
const OPENAI_IMAGE_ENDPOINT = 'https://api.openai.com/v1/images/generations'

function hashVisualCache(prompt: string, seed: number, provider: string, model: string) {
  return crypto.createHash('sha256').update(`${prompt}|${seed}|${provider}|${model}`).digest('hex')
}

async function downloadToFile(url: string, outPath: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await fs.outputFile(outPath, buf)
}

export async function generateShotBg(shot: Shot, projectId: string): Promise<{ localPath: string; seed: number; provider: string; prompt: string }> {
  const outDir = path.join('/tmp', projectId, 'shots')
  const outPath = path.join(outDir, `${shot.id}.png`)
  await fs.ensureDir(outDir)

  // If the local file already exists, short-circuit
  if (await fs.pathExists(outPath)) {
    console.log(JSON.stringify({ sceneId: 'unknown', shotId: shot.id, provider: 'local-cache', seed: shot.seed, path: outPath }))
    return { localPath: outPath, seed: shot.seed, provider: 'local-cache', prompt: shot.prompt }
  }

  // Cache lookup in RTDB
  try {
    const db = await getRtdb()
    const key = hashVisualCache(shot.prompt, shot.seed, 'sdxl', 'sd3')
    const snap = await db.ref(`/cache/visuals/${key}`).get()
    if (snap.exists()) {
      const cached = snap.val() as { firebaseUrl?: string }
      if (cached?.firebaseUrl) {
        await downloadToFile(cached.firebaseUrl, outPath)
        console.log(JSON.stringify({ sceneId: 'unknown', shotId: shot.id, provider: 'cache-remote', seed: shot.seed, path: outPath }))
        return { localPath: outPath, seed: shot.seed, provider: 'cache-remote', prompt: shot.prompt }
      }
    }
  } catch {}

  // Provider: Stability SDXL
  const stabKey = process.env.STABILITY_API_KEY
  if (stabKey) {
    try {
      const fd = new FormData()
      fd.set('prompt', shot.prompt)
      fd.set('seed', String(shot.seed))
      fd.set('output_format', 'png')
      const resp = await fetch(STABILITY_ENDPOINT, { method: 'POST', headers: { Authorization: `Bearer ${stabKey}` }, body: fd as any })
      if (resp.ok) {
        const buf = Buffer.from(await resp.arrayBuffer())
        await fs.outputFile(outPath, buf)
        const stat = await fs.stat(outPath)
        if (!stat.size) throw new Error('Empty image from Stability')
        try {
          const db = await getRtdb(); const key = hashVisualCache(shot.prompt, shot.seed, 'sdxl', 'sd3')
          await db.ref(`/cache/visuals/${key}`).set({ provider: 'sdxl', model: 'sd3', seed: shot.seed, firebaseUrl: '' })
        } catch {}
        console.log(JSON.stringify({ sceneId: 'unknown', shotId: shot.id, provider: 'sdxl', seed: shot.seed, path: outPath }))
        return { localPath: outPath, seed: shot.seed, provider: 'sdxl', prompt: shot.prompt }
      }
      if (resp.status >= 500 || resp.status === 429) throw new Error(`Stability ${resp.status}`)
    } catch (e) {
      // fallback below
    }
  }

  // Fallback: OpenAI DALL·E
  const openai = process.env.OPENAI_API_KEY
  if (!openai) throw new Error('No provider available: set STABILITY_API_KEY or OPENAI_API_KEY')
  const body = { model: 'gpt-image-3', prompt: shot.prompt, size: '1024x1024', response_format: 'b64_json' }
  const r = await fetch(OPENAI_IMAGE_ENDPOINT, { method: 'POST', headers: { 'Authorization': `Bearer ${openai}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`OpenAI image ${r.status}`)
  const data: any = await r.json()
  const b64 = data?.data?.[0]?.b64_json
  if (!b64) throw new Error('OpenAI image returned no b64')
  const buf = Buffer.from(b64, 'base64')
  await fs.outputFile(outPath, buf)
  const stat = await fs.stat(outPath); if (!stat.size) throw new Error('Empty image from OpenAI')
  try {
    const db = await getRtdb(); const key = hashVisualCache(shot.prompt, shot.seed, 'openai', 'gpt-image-3')
    await db.ref(`/cache/visuals/${key}`).set({ provider: 'openai', model: 'gpt-image-3', seed: shot.seed, firebaseUrl: '' })
  } catch {}
  console.log(JSON.stringify({ sceneId: 'unknown', shotId: shot.id, provider: 'openai', seed: shot.seed, path: outPath }))
  return { localPath: outPath, seed: shot.seed, provider: 'openai', prompt: shot.prompt }
}

export async function generateVisualsForScene(scene: Scene, projectId: string): Promise<string[]> {
  const results: string[] = []
  for (const shot of scene.shots) {
    const bg = await generateShotBg(shot, projectId)
    results.push(bg.localPath)
  }
  return results
}


