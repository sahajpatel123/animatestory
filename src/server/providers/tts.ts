import fs from 'fs-extra'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

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

export function ffprobeDuration(filePath: string): number {
  const p = spawnSync(process.env.FFPROBE_PATH || 'ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', filePath])
  if (p.status !== 0) return 0
  const val = parseFloat((p.stdout || Buffer.from('0')).toString().trim())
  return isNaN(val) ? 0 : val
}


