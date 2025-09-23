import fs from 'fs-extra'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import crypto from 'node:crypto'
import { resolveFfmpeg } from '@/server/ffmpegPaths'
import { getRtdb } from '@/server/firebase'

// Minimal types; swap to '@/types/models' if present
export type Line = { id: string; who: string; text: string; estMs: number }
export type Scene = { id: string; title: string; shots: any[]; lines: Line[] }

export async function ttsElevenLabs(text: string, voiceId: string, outPath: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY missing')
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/wav',
    },
    body: JSON.stringify({ text, voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
  })
  if (!resp.ok) throw new Error(`TTS failed: ${resp.status}`)
  const buf = Buffer.from(await resp.arrayBuffer())
  await fs.ensureDir(path.dirname(outPath))
  await fs.writeFile(outPath, buf)
  return outPath
}

export async function ffprobeDuration(filePath: string): Promise<number> {
  const { ffprobe } = await resolveFfmpeg()
  const p = spawnSync(ffprobe || 'ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', filePath])
  if (p.status !== 0) return 0
  const val = parseFloat((p.stdout || Buffer.from('0')).toString().trim())
  return isNaN(val) ? 0 : val
}

function cacheKey(voiceId: string, text: string) {
  return crypto.createHash('sha256').update(`${voiceId}|${text}`).digest('hex')
}

export async function synthesizeLine(line: Line, projectId: string, voiceId = 'Rachel'): Promise<{ wavPath: string; durationMs: number; provider: string }> {
  const outDir = path.join('/tmp', projectId, 'audio')
  const outPath = path.join(outDir, `${line.id}.wav`)
  await fs.ensureDir(outDir)

  if (await fs.pathExists(outPath)) {
    const dur = Math.round((await ffprobeDuration(outPath)) * 1000)
    console.log(JSON.stringify({ sceneId: 'unknown', lineId: line.id, who: line.who, durationMs: dur, wavPath: outPath }))
    return { wavPath: outPath, durationMs: dur, provider: 'local-cache' }
  }

  // Cache in RTDB
  try {
    const db = await getRtdb()
    const key = cacheKey(voiceId, line.text)
    const snap = await db.ref(`/cache/tts/${key}`).get()
    if (snap.exists()) {
      const cached = snap.val() as { wavUrl?: string }
      if (cached?.wavUrl) {
        const res = await fetch(cached.wavUrl)
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer())
          await fs.writeFile(outPath, buf)
          const dur = Math.round((await ffprobeDuration(outPath)) * 1000)
          console.log(JSON.stringify({ sceneId: 'unknown', lineId: line.id, who: line.who, durationMs: dur, wavPath: outPath }))
          return { wavPath: outPath, durationMs: dur, provider: 'cache-remote' }
        }
      }
    }
  } catch {}

  // ElevenLabs synthesis
  const apiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVEN_API_KEY
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY missing')
  const resp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/wav',
    },
    body: JSON.stringify({
      text: line.text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.3, similarity_boost: 0.8 }
    })
  })
  if (!resp.ok) throw new Error(`TTS failed: ${resp.status}`)
  const buf = Buffer.from(await resp.arrayBuffer())
  await fs.writeFile(outPath, buf)
  const durationMs = Math.round((await ffprobeDuration(outPath)) * 1000)
  try {
    const db = await getRtdb(); const key = cacheKey(voiceId, line.text)
    await db.ref(`/cache/tts/${key}`).set({ provider: 'elevenlabs', voiceId, wavUrl: '' })
  } catch {}
  console.log(JSON.stringify({ sceneId: 'unknown', lineId: line.id, who: line.who, durationMs, wavPath: outPath }))
  return { wavPath: outPath, durationMs, provider: 'elevenlabs' }
}

export async function synthesizeSceneLines(scene: Scene, projectId: string, voiceId = 'Rachel'): Promise<string[]> {
  const paths: string[] = []
  for (const line of scene.lines) {
    const r = await synthesizeLine(line, projectId, voiceId)
    paths.push(r.wavPath)
  }
  return paths
}


