import fs from 'fs-extra'
import path from 'node:path'
import crypto from 'node:crypto'
import { getRtdb } from '@/server/firebase'
import { probeMs } from '@/server/media/duration'

export type Scene = { id: string; title: string; shots: Array<{ id: string; durationMs: number }>; lines: Array<{ id: string; who: string; text: string; estMs: number }> }

function hashKey(parts: string[]) { return crypto.createHash('sha256').update(parts.join('|')).digest('hex') }

async function concatLoopsTo(outPath: string, sources: string[], targetMs: number): Promise<number> {
  // Simple concatenation by repeating sources until >= targetMs
  await fs.ensureDir(path.dirname(outPath))
  let total = 0
  const chunks: Buffer[] = []
  while (total < targetMs) {
    for (const s of sources) {
      const buf = await fs.readFile(s)
      chunks.push(buf); total += await probeMs(s)
      if (total >= targetMs) break
    }
  }
  await fs.writeFile(outPath, Buffer.concat(chunks))
  return await probeMs(outPath)
}

export async function getActMusic(projectId: string, actIndex: number, targetMs: number, mood?: string): Promise<{ musicPath: string; provider: 'stable-audio' | 'loops'; durationMs: number; cacheKey: string }>{
  const outDir = path.join('/tmp', projectId, 'music')
  await fs.ensureDir(outDir)
  const outPath = path.join(outDir, `act_${actIndex}.wav`)
  const loopDir = path.join(process.cwd(), 'public', 'loops')
  const key = hashKey(['bgm', String(actIndex), String(targetMs), mood || '', projectId])

  // Cache lookup
  try {
    const db = getRtdb(); const snap = await db.ref(`/cache/bgm/${key}`).get()
    if (snap.exists() && await fs.pathExists(outPath)) {
      const meta = snap.val() as any
      return { musicPath: outPath, provider: meta.provider || 'loops', durationMs: await probeMs(outPath), cacheKey: key }
    }
  } catch {}

  const stableKey = process.env.STABLE_AUDIO_API_KEY
  if (stableKey) {
    try {
      // Placeholder call (real Stable Audio SDK differs). Treat as failure-safe and rely on loops if unavailable.
      // Here we just skip and fall back to loops to avoid blocking.
      throw new Error('skip-stable-audio-placeholder')
    } catch {}
  }

  // Fallback loops
  const loopCandidates = [path.join(loopDir, 'loop_calm.wav'), path.join(loopDir, 'loop_action.wav'), path.join(loopDir, 'loop_mystery.wav')]
  const existing = await Promise.all(loopCandidates.map(p => fs.pathExists(p)))
  const sources = loopCandidates.filter((_, i) => existing[i])
  if (!sources.length) throw new Error('No loop files found in public/loops')
  const durationMs = await concatLoopsTo(outPath, sources, targetMs)
  try { const db = getRtdb(); await db.ref(`/cache/bgm/${key}`).set({ provider: 'loops', durationMs, createdAtISO: new Date().toISOString() }) } catch {}
  return { musicPath: outPath, provider: 'loops', durationMs, cacheKey: key }
}

export async function getSfxForScene(scene: Scene, projectId: string): Promise<Array<{ path: string; atMs: number; label: string; provider: 'freesound' | 'pack' }>>{
  const outDir = path.join('/tmp', projectId, 'sfx')
  await fs.ensureDir(outDir)
  const key = hashKey(['sfx', scene.id, scene.title])
  try {
    const db = getRtdb(); const snap = await db.ref(`/cache/sfx/${key}`).get()
    if (snap.exists()) {
      const arr = snap.val() as Array<{ path: string; atMs: number; label: string; provider: 'freesound' | 'pack' }>
      const exists = await Promise.all(arr.map(a => fs.pathExists(a.path)))
      if (exists.every(Boolean)) return arr
    }
  } catch {}

  const totalMs = scene.shots.reduce((a, b) => a + (b.durationMs || 0), 0)
  const provider: 'freesound' | 'pack' = process.env.FREESOUND_API_KEY ? 'freesound' : 'pack'
  const results: Array<{ path: string; atMs: number; label: string; provider: 'freesound' | 'pack' }> = []

  if (provider === 'freesound') {
    try {
      // Simple heuristic queries
      const queries = ['woosh', 'hit', 'sparkle']
      let idx = 0
      for (const q of queries) {
        const resp = await fetch(`https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(q)}&fields=name,previews,license&filter=duration:[0.2 TO 5]`, { headers: { Authorization: `Token ${process.env.FREESOUND_API_KEY}` } })
        if (!resp.ok) continue
        const data: any = await resp.json(); const item = data?.results?.[0]
        if (!item) continue
        const url = item.previews?.['preview-hq-mp3'] || item.previews?.['preview-hq-ogg']
        if (!url) continue
        const local = path.join(outDir, `${q}_${idx++}.wav`)
        const buf = await (await fetch(url)).arrayBuffer(); await fs.writeFile(local, Buffer.from(buf))
        const atMs = idx === 1 ? Math.round(totalMs * 0.15) : idx === 2 ? Math.round(totalMs * 0.75) : Math.round(totalMs * 0.5)
        results.push({ path: local, atMs, label: q, provider: 'freesound' })
      }
    } catch {}
  }

  if (!results.length) {
    const packDir = path.join(process.cwd(), 'public', 'sfx')
    const names = ['woosh.wav', 'hit.wav', 'sparkle.wav', 'pageflip.wav']
    let idx = 0
    for (const n of names) {
      const p = path.join(packDir, n)
      if (await fs.pathExists(p)) {
        const out = path.join(outDir, `${path.parse(n).name}_${idx++}.wav`)
        await fs.copyFile(p, out)
        const atMs = idx === 1 ? Math.round(totalMs * 0.15) : idx === 2 ? Math.round(totalMs * 0.75) : Math.round(totalMs * 0.5)
        results.push({ path: out, atMs, label: path.parse(n).name, provider: 'pack' })
      }
      if (results.length >= 4) break
    }
  }

  try { const db = getRtdb(); await db.ref(`/cache/sfx/${key}`).set(results) } catch {}
  return results
}

export async function stageMusicAndSfxForScene(scene: Scene, projectId: string, targetMs: number, mood?: string): Promise<{ music?: { musicPath: string; durationMs: number }, sfx: Array<{ path: string; atMs: number; label: string }> }>{
  const actIndex = 0
  let music;
  try {
    const bgm = await getActMusic(projectId, actIndex, targetMs, mood)
    music = { musicPath: bgm.musicPath, durationMs: bgm.durationMs }
  } catch {}
  let sfx: Array<{ path: string; atMs: number; label: string }> = []
  try { sfx = await getSfxForScene(scene, projectId) } catch {}
  console.log(JSON.stringify({ sceneId: scene.id, actIndex, musicProvider: music ? 'ok' : 'none', musicPath: music?.musicPath, musicMs: music?.durationMs, sfxCount: sfx.length }))
  return { music, sfx }
}

export type AudioPlan = {
  voices: Array<{ character: string; tts: 'elevenlabs'|'openai'; voiceId: string }>
  sfx: Array<{ when: string; tag: string }>
  music: Array<{ act: number; mood: 'calm'|'tense'|'uplifting'; ref: string }>
  mix: { dialogueLUFS: string; musicDuckDb: number; finalLUFS: string }
}

export function buildAudioPlan(dialoguePlan: { targetSec: number; acts: any[]; scenes: any[]; characters: Array<{ name: string; ttsVoice: string }> }): AudioPlan {
  const voices = dialoguePlan.characters.map(c => ({ character: c.name, tts: 'elevenlabs' as const, voiceId: c.ttsVoice }))
  const sfx = [ { when: 'beats:environment', tag: 'forest' }, { when: 'beats:movement', tag: 'footsteps' } ]
  const music = [ { act: 0, mood: 'calm' as const, ref: 'theme_setup' }, { act: 1, mood: 'tense' as const, ref: 'theme_confront' }, { act: 2, mood: 'uplifting' as const, ref: 'theme_resolve' } ]
  return { voices, sfx, music, mix: { dialogueLUFS: '-12..-6', musicDuckDb: -10, finalLUFS: '-14' } }
}


