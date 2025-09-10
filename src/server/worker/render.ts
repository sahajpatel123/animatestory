import path from 'node:path'
import fs from 'fs-extra'
import ffmpeg from 'fluent-ffmpeg'
import { FFMPEG_PATH, FFPROBE_PATH } from '@/server/ffmpegPaths'

ffmpeg.setFfmpegPath(FFMPEG_PATH)
ffmpeg.setFfprobePath(FFPROBE_PATH)

export type SceneJob = {
  sceneId: string
  projectId: string
  shots: Array<{ bgPath: string; durationMs: number }>
  dialogueWavs: Array<{ id: string; who: string; wavPath: string }>
  captionsSrtPath: string
  musicPath?: string
  sfx?: Array<{ path: string; atMs: number; label: string }>
  outPath: string
}

export async function renderScene(job: SceneJob): Promise<{ sceneId: string; mp4Path: string; thumbPath: string; loudnorm: any }> {
  await fs.ensureDir(path.dirname(job.outPath))
  const tmp = job.outPath.replace(/\.mp4$/, '_tmp.mp4')
  const fps = 24
  const width = 1280; const height = 720

  // Build concat of still frames with durations
  const listPath = job.outPath.replace(/\.mp4$/, '_list.txt')
  const lines: string[] = []
  for (const s of job.shots) {
    lines.push(`file '${s.bgPath.replace(/'/g, "'\\''")}'`)
    lines.push(`duration ${Math.max(0.2, s.durationMs / 1000)}`)
  }
  await fs.writeFile(listPath, lines.join('\n'))

  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([`-r ${fps}`, `-s ${width}x${height}`])
      .videoCodec('libx264')
      .audioCodec('aac')
      .output(tmp)
      .on('end', () => resolve())
      .on('error', (e) => reject(e))
      .run()
  })

  // Add subtitles
  const subsOut = job.outPath.replace(/\.mp4$/, '_subs.mp4')
  await new Promise<void>((resolve, reject) => {
    ffmpeg(tmp)
      .outputOptions(['-vf', `subtitles=${job.captionsSrtPath}:force_style='Fontsize=28,Outline=1,PrimaryColour=&HFFFFFF&'`])
      .output(subsOut)
      .on('end', () => resolve())
      .on('error', (e) => reject(e))
      .run()
  })

  // Loudness normalization on final scene
  await new Promise<void>((resolve, reject) => {
    ffmpeg(subsOut)
      .outputOptions(['-af', 'loudnorm=I=-14:TP=-1.5:LRA=11'])
      .videoCodec('libx264')
      .audioCodec('aac')
      .output(job.outPath)
      .on('end', () => resolve())
      .on('error', (e) => reject(e))
      .run()
  })

  const thumbPath = path.join(path.dirname(job.outPath), `thumb_${job.sceneId}.png`)
  await new Promise<void>((resolve, reject) => {
    ffmpeg(job.outPath).screenshots({ timestamps: ['1'], filename: path.basename(thumbPath), folder: path.dirname(thumbPath), size: '640x?' }).on('end', resolve).on('error', reject)
  })

  return { sceneId: job.sceneId, mp4Path: job.outPath, thumbPath, loudnorm: {} }
}

export async function renderFinal(projectId: string, sceneMp4s: string[], outDir: string): Promise<{ finalMp4: string; hlsDir: string }>{
  await fs.ensureDir(outDir)
  const listPath = path.join(outDir, 'scenes.txt')
  await fs.writeFile(listPath, sceneMp4s.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n'))
  const finalMp4 = path.join(outDir, 'final.mp4')
  await new Promise<void>((resolve, reject) => {
    ffmpeg()
      .input(listPath)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions(['-c copy'])
      .output(finalMp4)
      .on('end', () => resolve())
      .on('error', (e) => reject(e))
      .run()
  })
  const hlsDir = path.join(outDir, 'hls')
  await fs.ensureDir(hlsDir)
  await new Promise<void>((resolve, reject) => {
    ffmpeg(finalMp4)
      .outputOptions(['-codec: copy', '-start_number 0', '-hls_time 4', '-hls_playlist_type vod'])
      .output(path.join(hlsDir, 'stream.m3u8'))
      .on('end', () => resolve())
      .on('error', (e) => reject(e))
      .run()
  })
  return { finalMp4, hlsDir }
}


