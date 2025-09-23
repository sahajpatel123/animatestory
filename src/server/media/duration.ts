import { spawnSync } from 'node:child_process'
import { resolveFfmpeg } from '@/server/ffmpegPaths'

export async function probeMs(localPath: string): Promise<number> {
  const { ffprobe } = await resolveFfmpeg()
  const p = spawnSync(ffprobe || 'ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', localPath])
  if (p.status !== 0) return 0
  const seconds = parseFloat((p.stdout || Buffer.from('0')).toString().trim())
  if (isNaN(seconds)) return 0
  return Math.round(seconds * 1000)
}


