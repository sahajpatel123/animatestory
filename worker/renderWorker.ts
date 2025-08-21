import { Worker, Queue, QueueScheduler, JobsOptions } from 'bullmq'
import IORedis from 'ioredis'
import path from 'node:path'
import fs from 'fs-extra'
import { run, ensureTools } from './ffmpeg'
import { kenBurnsFilter, srtFromCaptions } from './filters'

export type SceneJob = {
  projectId: string
  sceneIndex: number
  shots: { bgPath: string; durationMs: number; camera: 'cut'|'pan'|'zoom'; pan?: {from:[number,number]; to:[number,number]}; zoom?: {from:number; to:number}; caption?: string }[]
  dialogueWavs: { path: string; startMs: number; endMs: number }[]
  musicPath?: string
  sfx?: { path:string; startMs:number; gainDb?:number }[]
  outDir: string
}

export type FinalJob = { projectId: string; sceneMp4s: string[]; outDir: string; targetFps: number }

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379')
new QueueScheduler('render-queue', { connection })
export const renderQueue = new Queue('render-queue', { connection })

async function makeShot(bgPath: string, seconds: number, fps: number, outPath: string, pan?: SceneJob['shots'][0]['pan'], zoom?: SceneJob['shots'][0]['zoom']) {
  const { filter } = kenBurnsFilter(seconds, fps, pan, zoom)
  await run('ffmpeg', ['-y', '-loop', '1', '-t', String(seconds), '-i', bgPath, '-filter_complex', filter, '-r', String(fps), '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-an', outPath], path.dirname(outPath))
}

async function concatList(listPath: string, files: string[], outPath: string, copy = true) {
  await fs.writeFile(listPath, files.map(f => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'))
  const args = ['-y', '-f', 'concat', '-safe', '0', '-i', listPath]
  if (copy) args.push('-c', 'copy')
  await run('ffmpeg', [...args, outPath], path.dirname(outPath))
}

async function buildDialogueTrack(files: { path: string; startMs: number; endMs: number }[], outPath: string) {
  // Simple concat assuming pre-aligned WAVs, gaps should be pre-inserted by caller if needed
  const listPath = path.join(path.dirname(outPath), 'lines.txt')
  await fs.writeFile(listPath, files.map(f => `file '${f.path.replace(/'/g, "'\\''")}'`).join('\n'))
  await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c:a', 'aac', '-b:a', '192k', outPath], path.dirname(outPath))
}

async function mixAudio(sceneVideo: string, dialogue: string, music?: string, sfx?: string[], outPath?: string) {
  const args = ['-y', '-i', sceneVideo, '-i', dialogue]
  let filter = ''
  if (music) { args.push('-i', music); filter += "[2:a]volume=0.25[mus];[1:a][mus]sidechaincompress=threshold=0.05:ratio=8:attack=5:release=400[duck]" } else { filter += '[1:a]anull[duck]' }
  if (sfx && sfx.length) { args.push('-i', sfx[0]); filter += ';[duck][3:a]amix=inputs=2:dropout_transition=0[outa]' } else { filter += ';[duck]anull[outa]' }
  await run('ffmpeg', ['-y', ...args, '-filter_complex', filter, '-map', '0:v', '-map', '[outa]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', outPath || 'scene_mix.mp4'], path.dirname(sceneVideo))
}

async function burnSubs(inPath: string, captions: Array<{ startMs: number; endMs: number; text: string }>, outPath: string) {
  const srt = srtFromCaptions(captions)
  const srtPath = path.join(path.dirname(outPath), 'scene.srt')
  await fs.writeFile(srtPath, srt)
  await run('ffmpeg', ['-y', '-i', inPath, '-vf', "subtitles=scene.srt:force_style='Fontsize=28,Outline=1,PrimaryColour=&HFFFFFF&'", '-c:a', 'copy', outPath], path.dirname(outPath))
}

new Worker('render-queue', async (job) => {
  await ensureTools()
  if (job.name === 'render:scene') {
    const p = job.data as SceneJob
    const fps = 30
    await fs.ensureDir(p.outDir)
    const shotPaths: string[] = []
    let progress = 0
    for (let i = 0; i < p.shots.length; i++) {
      const sh = p.shots[i]
      const out = path.join(p.outDir, `shot_${String(i).padStart(2,'0')}.mp4`)
      await makeShot(sh.bgPath, sh.durationMs/1000, fps, out, sh.pan, sh.zoom)
      shotPaths.push(out)
      progress = Math.round(((i+1)/p.shots.length)*30)
      await job.updateProgress(progress)
    }
    const listPath = path.join(p.outDir, 'shots.txt')
    const sceneVideo = path.join(p.outDir, 'scene_video.mp4')
    await concatList(listPath, shotPaths, sceneVideo)
    await job.updateProgress(50)

    const dialoguePath = path.join(p.outDir, 'dialogue.wav')
    await buildDialogueTrack(p.dialogueWavs, dialoguePath)
    await job.updateProgress(65)

    const mixPath = path.join(p.outDir, 'scene_mix.mp4')
    await mixAudio(sceneVideo, dialoguePath, p.musicPath, p.sfx?.map(s => s.path), mixPath)
    await job.updateProgress(75)

    const captions = p.dialogueWavs.map((d, i) => ({ startMs: d.startMs, endMs: d.endMs, text: p.shots[i]?.caption || '' }))
    const finalPath = path.join(p.outDir, `scene_${String(p.sceneIndex).padStart(2,'0')}.mp4`)
    await burnSubs(mixPath, captions, finalPath)
    await job.updateProgress(100)
    return { sceneIndex: p.sceneIndex, path: finalPath }
  }

  if (job.name === 'render:final') {
    const { sceneMp4s, outDir, targetFps } = job.data as FinalJob
    await fs.ensureDir(outDir)
    const listPath = path.join(outDir, 'scenes.txt')
    const tempFull = path.join(outDir, 'temp_full.mp4')
    await concatList(listPath, sceneMp4s, tempFull)
    const final = path.join(outDir, 'final.mp4')
    await run('ffmpeg', ['-y', '-i', tempFull, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-c:v', 'copy', final], outDir)
    const hls = path.join(outDir, 'stream.m3u8')
    await run('ffmpeg', ['-y', '-i', final, '-codec:', 'copy', '-start_number', '0', '-hls_time', '4', '-hls_playlist_type', 'vod', 'stream.m3u8'], outDir)
    return { final, hls }
  }
}, { connection })


