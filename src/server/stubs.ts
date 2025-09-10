import { spawnSync } from 'node:child_process'
import path from 'node:path'
import fs from 'fs-extra'
import { FFMPEG_PATH } from '@/server/ffmpegPaths'

export async function stubPng(out: string, w = 1280, h = 720, color = 'black'): Promise<void> {
  await fs.ensureDir(path.dirname(out))
  const args = ['-f', 'lavfi', '-i', `color=c=${color}:s=${w}x${h}:d=0.1`, '-frames:v', '1', out]
  const r = spawnSync(FFMPEG_PATH || 'ffmpeg', args)
  if (r.status !== 0) throw new Error(`stubPng failed: ${r.stderr?.toString()?.slice(0, 200)}`)
}

export async function stubSilence(out: string, ms = 200): Promise<void> {
  await fs.ensureDir(path.dirname(out))
  const seconds = Math.max(0.05, ms / 1000)
  const args = ['-f', 'lavfi', '-t', String(seconds), '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100', '-acodec', 'pcm_s16le', out]
  const r = spawnSync(FFMPEG_PATH || 'ffmpeg', args)
  if (r.status !== 0) throw new Error(`stubSilence failed: ${r.stderr?.toString()?.slice(0, 200)}`)
}


